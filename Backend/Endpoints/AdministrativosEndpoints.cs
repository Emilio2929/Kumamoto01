using Kumamoto.API.Data;
using Kumamoto.API.DTOs;
using Kumamoto.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Endpoints;

public static class AdministrativosEndpoints
{
    private const int ROL_ADMINISTRATIVO = 5;

    public static void MapAdministrativosEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/administrativos").WithTags("Administrativos").RequireAuthorization();

        // GET /api/administrativos → todos los administrativos
        group.MapGet("/", async (KumamotoDbContext db) =>
        {
            var adminis = await db.Usuarios
                .Where(u => u.RolId == ROL_ADMINISTRATIVO)
                .OrderBy(u => u.Apellidos).ThenBy(u => u.Nombres)
                .Select(u => new AdministrativoDetalleDto(
                    u.Id, u.Dni, u.Nombres, u.Apellidos, u.Correo, u.CorreoPersonal, u.Telefono, u.Estado
                ))
                .ToListAsync();
            return Results.Ok(adminis);
        }).WithName("GetAdministrativos");

        // ── POST /api/administrativos  → crear con credenciales auto-generadas
        group.MapPost("/", async (CreateAdministrativoDto dto, KumamotoDbContext db, Kumamoto.API.Services.EmailService emailService) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Dni) || dto.Dni.Length != 8)
                return Results.BadRequest(new { mensaje = "El DNI debe tener 8 dígitos." });
            if (string.IsNullOrWhiteSpace(dto.Nombres))
                return Results.BadRequest(new { mensaje = "Los nombres son requeridos." });
            if (string.IsNullOrWhiteSpace(dto.Apellidos))
                return Results.BadRequest(new { mensaje = "Los apellidos son requeridos." });

            var existeDni = await db.Usuarios.AnyAsync(u => u.Dni == dto.Dni);
            if (existeDni)
                return Results.Conflict(new { mensaje = "Ya existe un usuario con ese DNI." });

            if (!string.IsNullOrWhiteSpace(dto.CorreoPersonal))
            {
                var existeCorreo = await db.Usuarios.AnyAsync(u => u.CorreoPersonal == dto.CorreoPersonal);
                if (existeCorreo)
                    return Results.Conflict(new { mensaje = "Ese correo personal ya está registrado." });
            }

            var existeEstudiante = await db.Estudiantes.AnyAsync(e => e.Dni == dto.Dni);
            if (existeEstudiante)
                return Results.Conflict(new { mensaje = "El DNI ya está registrado como estudiante." });

            var correo = await GenerarCorreoUnicoAsync(dto.Nombres.Trim(), dto.Apellidos.Trim(), db);
            var clave = $"Kuma{dto.Dni}";

            var admin = new Usuario
            {
                Dni       = dto.Dni.Trim(),
                Nombres   = dto.Nombres.Trim(),
                Apellidos = dto.Apellidos.Trim(),
                Correo    = correo,
                CorreoPersonal = dto.CorreoPersonal?.Trim(),
                Telefono  = dto.Telefono?.Trim(),
                ClaveHash = clave,
                RolId     = ROL_ADMINISTRATIVO,
                Estado    = 1
            };
            db.Usuarios.Add(admin);
            await db.SaveChangesAsync();

            var correoDestino = !string.IsNullOrWhiteSpace(admin.CorreoPersonal) ? admin.CorreoPersonal : admin.Correo;
            await emailService.EnviarCredencialesAccesoAsync(correoDestino!, $"{admin.Nombres} {admin.Apellidos}", clave, "Administrativo");

            var msg = string.IsNullOrWhiteSpace(admin.CorreoPersonal)
                ? $"Administrativo registrado. Credenciales enviadas a correo institucional: {correo}."
                : $"Administrativo registrado exitosamente. Las credenciales de acceso se enviaron a su correo personal: {admin.CorreoPersonal}";

            return Results.Created($"/api/administrativos/{admin.Id}", new
            {
                admin.Id,
                correo,
                mensaje = msg
            });

        }).WithName("CreateAdministrativo");

        // ── PUT /api/administrativos/{id}  → editar datos
        group.MapPut("/{id:int}", async (int id, UpdateAdministrativoDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Nombres))
                return Results.BadRequest(new { mensaje = "El nombre es requerido." });

            var admin = await db.Usuarios.FindAsync(id);
            if (admin is null || admin.RolId != ROL_ADMINISTRATIVO) return Results.NotFound();

            if (!string.IsNullOrWhiteSpace(dto.CorreoPersonal))
            {
                var dup = await db.Usuarios.AnyAsync(u => u.CorreoPersonal == dto.CorreoPersonal && u.Id != id);
                if (dup) return Results.Conflict(new { mensaje = "Ese correo personal ya está en uso." });
            }

            admin.Nombres = dto.Nombres.Trim();
            admin.Apellidos = dto.Apellidos?.Trim() ?? admin.Apellidos;
            admin.CorreoPersonal = string.IsNullOrWhiteSpace(dto.CorreoPersonal) ? admin.CorreoPersonal : dto.CorreoPersonal.Trim();
            admin.Telefono = dto.Telefono?.Trim();
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("UpdateAdministrativo");

        // ── PATCH /api/administrativos/{id}/clave  → cambiar contraseña
        group.MapPatch("/{id:int}/clave", async (int id, CambiarClaveDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.NuevaClave) || dto.NuevaClave.Length < 4)
                return Results.BadRequest(new { mensaje = "La contraseña debe tener al menos 4 caracteres." });

            var admin = await db.Usuarios.FindAsync(id);
            if (admin is null || admin.RolId != ROL_ADMINISTRATIVO) return Results.NotFound();

            admin.ClaveHash = dto.NuevaClave.Trim();
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("CambiarClaveAdministrativo");

        // ── PATCH /api/administrativos/{id}/estado  → toggle activo/inactivo
        group.MapPatch("/{id:int}/estado", async (int id, KumamotoDbContext db) =>
        {
            var a = await db.Usuarios.FindAsync(id);
            if (a is null || a.RolId != ROL_ADMINISTRATIVO) return Results.NotFound();
            a.Estado = a.Estado == 1 ? (short)0 : (short)1;
            await db.SaveChangesAsync();
            return Results.Ok(new { a.Estado });
        }).WithName("ToggleAdministrativoEstado");

        // ── DELETE /api/administrativos/{id}  → eliminación lógica
        group.MapDelete("/{id:int}", async (int id, KumamotoDbContext db) =>
        {
            var a = await db.Usuarios.FindAsync(id);
            if (a is null || a.RolId != ROL_ADMINISTRATIVO) return Results.NotFound();
            a.Estado = 0;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("DeleteAdministrativo");
    }

    private static async Task<string> GenerarCorreoUnicoAsync(
        string nombres, string apellidos, KumamotoDbContext db)
    {
        var letraNombre  = NormalizarTexto(nombres.Split(' ')[0])[0].ToString();
        var primerApellido = NormalizarTexto(apellidos.Split(' ')[0]);
        var baseLocal    = $"{letraNombre}{primerApellido}";
        var dominio      = "@kumamoto.pe";

        var candidato = $"{baseLocal}{dominio}";
        if (!await db.Usuarios.AnyAsync(u => u.Correo == candidato))
            return candidato;

        for (int i = 2; i <= 999; i++)
        {
            candidato = $"{baseLocal}{i}{dominio}";
            if (!await db.Usuarios.AnyAsync(u => u.Correo == candidato))
                return candidato;
        }
        return $"{baseLocal}{Guid.NewGuid().ToString()[..4]}{dominio}";
    }

    private static string NormalizarTexto(string texto)
    {
        var normalizado = texto.Normalize(System.Text.NormalizationForm.FormD);
        var sb = new System.Text.StringBuilder();
        foreach (var c in normalizado)
        {
            var cat = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
            if (cat != System.Globalization.UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }
        return sb.ToString()
                 .Normalize(System.Text.NormalizationForm.FormC)
                 .ToLower()
                 .Replace("ñ", "n");
    }
}
