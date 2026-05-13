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
                    u.Id, u.Dni, u.Nombres, u.Apellidos, u.Correo, u.Telefono, u.Estado
                ))
                .ToListAsync();
            return Results.Ok(adminis);
        }).WithName("GetAdministrativos");

        // POST /api/administrativos → crear con credenciales auto-generadas
        group.MapPost("/", async (CreateAdministrativoDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Dni) || dto.Dni.Length != 8)
                return Results.BadRequest(new { mensaje = "El DNI debe tener 8 dígitos." });
            if (string.IsNullOrWhiteSpace(dto.Nombres))
                return Results.BadRequest(new { mensaje = "Los nombres son requeridos." });
            if (string.IsNullOrWhiteSpace(dto.Apellidos))
                return Results.BadRequest(new { mensaje = "Los apellidos son requeridos." });

            if (string.IsNullOrWhiteSpace(dto.Correo))
                return Results.BadRequest(new { mensaje = "El correo electrónico es requerido." });

            var existeDni = await db.Usuarios.AnyAsync(u => u.Dni == dto.Dni);
            if (existeDni)
                return Results.Conflict(new { mensaje = "Ya existe un usuario con ese DNI." });

            var existeCorreo = await db.Usuarios.AnyAsync(u => u.Correo == dto.Correo);
            if (existeCorreo)
                return Results.Conflict(new { mensaje = "Ese correo ya está registrado." });

            var existeEstudiante = await db.Estudiantes.AnyAsync(e => e.Dni == dto.Dni);
            if (existeEstudiante)
                return Results.Conflict(new { mensaje = "El DNI ya está registrado como estudiante." });

            var clave = $"Kuma{dto.Dni}";

            var admin = new Usuario
            {
                Dni       = dto.Dni.Trim(),
                Nombres   = dto.Nombres.Trim(),
                Apellidos = dto.Apellidos.Trim(),
                Correo    = dto.Correo.Trim().ToLower(),
                Telefono  = dto.Telefono?.Trim(),
                ClaveHash = clave,
                RolId     = ROL_ADMINISTRATIVO,
                Estado    = 1
            };
            db.Usuarios.Add(admin);
            await db.SaveChangesAsync();

            return Results.Created($"/api/administrativos/{admin.Id}", new
            {
                admin.Id,
                correo = admin.Correo,
                claveGenerada = clave,
                mensaje = $"Credenciales enviadas a {admin.Correo}. Clave temporal: {clave}"
            });

        }).WithName("CreateAdministrativo");

        // PUT /api/administrativos/{id} → editar datos
        group.MapPut("/{id:int}", async (int id, UpdateAdministrativoDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Nombres))
                return Results.BadRequest(new { mensaje = "El nombre es requerido." });

            var admin = await db.Usuarios.FindAsync(id);
            if (admin is null || admin.RolId != ROL_ADMINISTRATIVO) return Results.NotFound();

            if (!string.IsNullOrWhiteSpace(dto.Correo))
            {
                var dup = await db.Usuarios.AnyAsync(u => u.Correo == dto.Correo && u.Id != id);
                if (dup) return Results.Conflict(new { mensaje = "Ese correo ya está en uso." });
            }

            admin.Nombres = dto.Nombres.Trim();
            admin.Apellidos = dto.Apellidos?.Trim() ?? admin.Apellidos;
            admin.Correo = string.IsNullOrWhiteSpace(dto.Correo) ? admin.Correo : dto.Correo.Trim();
            admin.Telefono = dto.Telefono?.Trim();
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("UpdateAdministrativo");

        // PATCH /api/administrativos/{id}/clave → cambiar contraseña
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

        // PATCH /api/administrativos/{id}/estado → toggle activo/inactivo
        group.MapPatch("/{id:int}/estado", async (int id, KumamotoDbContext db) =>
        {
            var a = await db.Usuarios.FindAsync(id);
            if (a is null || a.RolId != ROL_ADMINISTRATIVO) return Results.NotFound();
            a.Estado = a.Estado == 1 ? (short)0 : (short)1;
            await db.SaveChangesAsync();
            return Results.Ok(new { a.Estado });
        }).WithName("ToggleAdministrativoEstado");

        // DELETE /api/administrativos/{id} → eliminación lógica
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
        var dominio      = "@kumamoto.edu.pe";

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
