using Kumamoto.API.Data;
using Kumamoto.API.DTOs;
using Kumamoto.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Endpoints;

public static class DocentesEndpoints
{
    private const int ROL_DOCENTE = 2;

    public static void MapDocentesEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/docentes").WithTags("Docentes").RequireAuthorization();

        // ── GET /api/docentes  → todos los docentes
        group.MapGet("/", async (KumamotoDbContext db) =>
        {
            var docentes = await db.Usuarios
                .Where(u => u.RolId == ROL_DOCENTE)
                .OrderBy(u => u.Apellidos).ThenBy(u => u.Nombres)
                .Select(u => new DocenteDetalleDto(
                    u.Id, u.Dni, u.Nombres, u.Apellidos, u.Correo, u.CorreoPersonal, u.Telefono, u.Estado
                ))
                .ToListAsync();
            return Results.Ok(docentes);
        }).WithName("GetDocentes");

        // ── GET /api/docentes/combo  → lista para selects
        group.MapGet("/combo", async (KumamotoDbContext db) =>
        {
            var list = await db.Usuarios
                .Where(u => u.RolId == ROL_DOCENTE && u.Estado == 1)
                .OrderBy(u => u.Apellidos)
                .Select(u => new { u.Id, NombreCompleto = $"{u.Nombres} {u.Apellidos}" })
                .ToListAsync();
            return Results.Ok(list);
        }).WithName("GetDocentesCombo");

        // ── POST /api/docentes  → crear con credenciales auto-generadas
        group.MapPost("/", async (CreateDocenteDto dto, KumamotoDbContext db, Kumamoto.API.Services.EmailService emailService) =>
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

            // Genera correo: [1ra letra nombre][primer apellido]@kumamoto.pe
            var correo = await GenerarCorreoUnicoAsync(dto.Nombres.Trim(), dto.Apellidos.Trim(), db);
            var clave  = $"Kuma{dto.Dni}";

            var docente = new Usuario
            {
                Dni       = dto.Dni.Trim(),
                Nombres   = dto.Nombres.Trim(),
                Apellidos = dto.Apellidos.Trim(),
                Correo    = correo,
                CorreoPersonal = dto.CorreoPersonal?.Trim(),
                Telefono  = dto.Telefono?.Trim(),
                ClaveHash = clave,
                RolId     = ROL_DOCENTE,
                Estado    = 1
            };
            db.Usuarios.Add(docente);
            await db.SaveChangesAsync();

            var correoDestino = !string.IsNullOrWhiteSpace(docente.CorreoPersonal) ? docente.CorreoPersonal : docente.Correo;
            await emailService.EnviarCredencialesAccesoAsync(correoDestino!, $"{docente.Nombres} {docente.Apellidos}", clave, "Docente");

            var msg = string.IsNullOrWhiteSpace(docente.CorreoPersonal)
                ? $"Docente registrado. Credenciales enviadas a correo institucional: {correo}."
                : $"Docente registrado exitosamente. Las credenciales de acceso se enviaron a su correo personal: {docente.CorreoPersonal}";

            return Results.Created($"/api/docentes/{docente.Id}", new
            {
                docente.Id,
                correo,
                mensaje = msg
            });
        }).WithName("CreateDocente");

        // ── PUT /api/docentes/{id}  → editar datos
        group.MapPut("/{id:int}", async (int id, UpdateDocenteDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Nombres))
                return Results.BadRequest(new { mensaje = "El nombre es requerido." });

            var docente = await db.Usuarios.FindAsync(id);
            if (docente is null || docente.RolId != ROL_DOCENTE) return Results.NotFound();

            if (!string.IsNullOrWhiteSpace(dto.CorreoPersonal))
            {
                var dup = await db.Usuarios.AnyAsync(u => u.CorreoPersonal == dto.CorreoPersonal && u.Id != id);
                if (dup) return Results.Conflict(new { mensaje = "Ese correo personal ya está en uso." });
            }

            docente.Nombres = dto.Nombres.Trim();
            docente.Apellidos = dto.Apellidos?.Trim() ?? docente.Apellidos;
            docente.CorreoPersonal = string.IsNullOrWhiteSpace(dto.CorreoPersonal) ? docente.CorreoPersonal : dto.CorreoPersonal.Trim();
            docente.Telefono = dto.Telefono?.Trim();
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("UpdateDocente");

        // ── PATCH /api/docentes/{id}/clave  → cambiar contraseña
        group.MapPatch("/{id:int}/clave", async (int id, CambiarClaveDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.NuevaClave) || dto.NuevaClave.Length < 4)
                return Results.BadRequest(new { mensaje = "La contraseña debe tener al menos 4 caracteres." });

            var docente = await db.Usuarios.FindAsync(id);
            if (docente is null || docente.RolId != ROL_DOCENTE) return Results.NotFound();

            docente.ClaveHash = dto.NuevaClave.Trim();
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("CambiarClaveDocente");

        // ── PATCH /api/docentes/{id}/estado  → toggle activo/inactivo
        group.MapPatch("/{id:int}/estado", async (int id, KumamotoDbContext db) =>
        {
            var d = await db.Usuarios.FindAsync(id);
            if (d is null || d.RolId != ROL_DOCENTE) return Results.NotFound();
            d.Estado = d.Estado == 1 ? (short)0 : (short)1;
            await db.SaveChangesAsync();
            return Results.Ok(new { d.Estado });
        }).WithName("ToggleDocenteEstado");

        // ── DELETE /api/docentes/{id}  → eliminación lógica
        group.MapDelete("/{id:int}", async (int id, KumamotoDbContext db) =>
        {
            var d = await db.Usuarios.FindAsync(id);
            if (d is null || d.RolId != ROL_DOCENTE) return Results.NotFound();
            d.Estado = 0;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("DeleteDocente");

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
        var normalizado = texto
            .Normalize(System.Text.NormalizationForm.FormD);
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
