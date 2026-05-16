using Kumamoto.API.Data;
using Kumamoto.API.DTOs;
using Kumamoto.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Endpoints;

public static class AuxiliaresAdminEndpoints
{
    private const int ROL_AUXILIAR = 3;

    public static void MapAuxiliaresAdminEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auxiliares-admin").WithTags("Auxiliares Admin").RequireAuthorization();

        // GET /api/auxiliares-admin → todos los auxiliares
        group.MapGet("/", async (KumamotoDbContext db) =>
        {
            var auxiliares = await db.Usuarios
                .Where(u => u.RolId == ROL_AUXILIAR)
                .OrderBy(u => u.Apellidos).ThenBy(u => u.Nombres)
                .Select(u => new AuxiliarDetalleDto(
                    u.Id, u.Dni, u.Nombres, u.Apellidos, u.Correo, u.CorreoPersonal, u.Telefono, u.Estado
                ))
                .ToListAsync();
            return Results.Ok(auxiliares);
        }).WithName("GetAuxiliaresAdmin");

        // POST /api/auxiliares-admin → crear con credenciales auto-generadas
        group.MapPost("/", async (CreateAuxiliarDto dto, KumamotoDbContext db) =>
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

            var auxiliar = new Usuario
            {
                Dni       = dto.Dni.Trim(),
                Nombres   = dto.Nombres.Trim(),
                Apellidos = dto.Apellidos.Trim(),
                Correo    = correo,
                CorreoPersonal = dto.CorreoPersonal?.Trim(),
                Telefono  = dto.Telefono?.Trim(),
                ClaveHash = clave,
                RolId     = ROL_AUXILIAR,
                Estado    = 1
            };
            db.Usuarios.Add(auxiliar);
            await db.SaveChangesAsync();

            return Results.Created($"/api/auxiliares-admin/{auxiliar.Id}", new
            {
                auxiliar.Id,
                correo,
                claveGenerada = clave,
                mensaje = $"Credenciales enviadas a {correo}. Clave temporal: {clave}"
            });

        }).WithName("CreateAuxiliarAdmin");

        // PUT /api/auxiliares-admin/{id} → editar datos
        group.MapPut("/{id:int}", async (int id, UpdateAuxiliarDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Nombres))
                return Results.BadRequest(new { mensaje = "El nombre es requerido." });

            var auxiliar = await db.Usuarios.FindAsync(id);
            if (auxiliar is null || auxiliar.RolId != ROL_AUXILIAR) return Results.NotFound();

            if (!string.IsNullOrWhiteSpace(dto.CorreoPersonal))
            {
                var dup = await db.Usuarios.AnyAsync(u => u.CorreoPersonal == dto.CorreoPersonal && u.Id != id);
                if (dup) return Results.Conflict(new { mensaje = "Ese correo personal ya está en uso." });
            }

            auxiliar.Nombres = dto.Nombres.Trim();
            auxiliar.Apellidos = dto.Apellidos?.Trim() ?? auxiliar.Apellidos;
            auxiliar.CorreoPersonal = string.IsNullOrWhiteSpace(dto.CorreoPersonal) ? auxiliar.CorreoPersonal : dto.CorreoPersonal.Trim();
            auxiliar.Telefono = dto.Telefono?.Trim();
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("UpdateAuxiliarAdmin");

        // PATCH /api/auxiliares-admin/{id}/clave → cambiar contraseña
        group.MapPatch("/{id:int}/clave", async (int id, CambiarClaveDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.NuevaClave) || dto.NuevaClave.Length < 4)
                return Results.BadRequest(new { mensaje = "La contraseña debe tener al menos 4 caracteres." });

            var auxiliar = await db.Usuarios.FindAsync(id);
            if (auxiliar is null || auxiliar.RolId != ROL_AUXILIAR) return Results.NotFound();

            auxiliar.ClaveHash = dto.NuevaClave.Trim();
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("CambiarClaveAuxiliarAdmin");

        // PATCH /api/auxiliares-admin/{id}/estado → toggle activo/inactivo
        group.MapPatch("/{id:int}/estado", async (int id, KumamotoDbContext db) =>
        {
            var a = await db.Usuarios.FindAsync(id);
            if (a is null || a.RolId != ROL_AUXILIAR) return Results.NotFound();
            a.Estado = a.Estado == 1 ? (short)0 : (short)1;
            await db.SaveChangesAsync();
            return Results.Ok(new { a.Estado });
        }).WithName("ToggleAuxiliarEstadoAdmin");

        // DELETE /api/auxiliares-admin/{id} → eliminación lógica
        group.MapDelete("/{id:int}", async (int id, KumamotoDbContext db) =>
        {
            var a = await db.Usuarios.FindAsync(id);
            if (a is null || a.RolId != ROL_AUXILIAR) return Results.NotFound();
            a.Estado = 0;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("DeleteAuxiliarAdmin");
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
