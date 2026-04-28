using Kumamoto.API.Data;
using Kumamoto.API.DTOs;
using Kumamoto.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Endpoints;

public static class PadresEndpoints
{
    private const int ROL_PADRE = 4;

    public static void MapPadresEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/padres").WithTags("Padres").RequireAuthorization();

        // ── GET /api/padres  → todos los padres registrados
        group.MapGet("/", async (KumamotoDbContext db) =>
        {
            var padres = await db.Usuarios
                .Where(u => u.RolId == ROL_PADRE)
                .OrderBy(u => u.Apellidos).ThenBy(u => u.Nombres)
                .Select(u => new PadreDetalleDto(
                    u.Id, u.Dni, u.Nombres, u.Apellidos, u.Correo, u.Telefono, u.Estado
                ))
                .ToListAsync();
            return Results.Ok(padres);
        }).WithName("GetPadres");

        // ── GET /api/padres/buscar?dni=X  → buscar padre por DNI
        group.MapGet("/buscar", async (string? dni, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dni) || dni.Length < 4)
                return Results.BadRequest(new { mensaje = "Ingrese al menos 4 dígitos del DNI." });

            var padre = await db.Usuarios
                .Where(u => u.RolId == ROL_PADRE && u.Dni.Contains(dni.Trim()))
                .Select(u => new PadreDetalleDto(
                    u.Id, u.Dni, u.Nombres, u.Apellidos, u.Correo, u.Telefono, u.Estado
                ))
                .FirstOrDefaultAsync();

            return padre is null
                ? Results.NotFound(new { mensaje = "No se encontró ningún padre con ese DNI." })
                : Results.Ok(padre);
        }).WithName("BuscarPadrePorDni");

        // ── POST /api/padres  → crear padre con credenciales auto-generadas
        group.MapPost("/", async (CreatePadreDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Dni) || dto.Dni.Length != 8)
                return Results.BadRequest(new { mensaje = "El DNI debe tener 8 dígitos." });
            if (string.IsNullOrWhiteSpace(dto.Nombres))
                return Results.BadRequest(new { mensaje = "El nombre es requerido." });
            if (string.IsNullOrWhiteSpace(dto.Apellidos))
                return Results.BadRequest(new { mensaje = "Los apellidos son requeridos." });

            var existeDni = await db.Usuarios.AnyAsync(u => u.Dni == dto.Dni);
            if (existeDni)
                return Results.Conflict(new { mensaje = "Ya existe un usuario con ese DNI." });

            // Generar correo y contraseña institucional
            var correo = $"p{dto.Dni}@kumamoto.edu.pe";
            var clave = $"Kuma{dto.Dni}";

            var existeCorreo = await db.Usuarios.AnyAsync(u => u.Correo == correo);
            if (existeCorreo)
                return Results.Conflict(new { mensaje = "Ya existe un usuario con ese correo institucional." });

            var padre = new Usuario
            {
                Dni = dto.Dni.Trim(),
                Nombres = dto.Nombres.Trim(),
                Apellidos = dto.Apellidos.Trim(),
                Correo = correo,
                Telefono = dto.Telefono?.Trim(),
                ClaveHash = clave,
                RolId = ROL_PADRE,
                Estado = 1
            };
            db.Usuarios.Add(padre);
            await db.SaveChangesAsync();

            return Results.Created($"/api/padres/{padre.Id}", new
            {
                padre.Id,
                correo,
                claveGenerada = clave,
                mensaje = $"Credenciales generadas: correo={correo} | clave={clave}"
            });
        }).WithName("CreatePadre");

        // ── PUT /api/padres/{id}  → editar datos del padre
        group.MapPut("/{id:int}", async (int id, UpdatePadreDto dto, KumamotoDbContext db) =>
        {
            var padre = await db.Usuarios.FindAsync(id);
            if (padre is null || padre.RolId != ROL_PADRE) return Results.NotFound();

            if (string.IsNullOrWhiteSpace(dto.Nombres))
                return Results.BadRequest(new { mensaje = "El nombre es requerido." });

            // Verificar correo único si se cambia
            if (!string.IsNullOrWhiteSpace(dto.Correo))
            {
                var duplicado = await db.Usuarios.AnyAsync(u => u.Correo == dto.Correo && u.Id != id);
                if (duplicado)
                    return Results.Conflict(new { mensaje = "Ese correo ya está en uso." });
            }

            padre.Nombres = dto.Nombres.Trim();
            padre.Apellidos = dto.Apellidos?.Trim() ?? padre.Apellidos;
            padre.Correo = string.IsNullOrWhiteSpace(dto.Correo) ? padre.Correo : dto.Correo.Trim();
            padre.Telefono = dto.Telefono?.Trim();
            await db.SaveChangesAsync();

            return Results.NoContent();
        }).WithName("UpdatePadre");

        // ── PATCH /api/padres/{id}/clave  → cambiar contraseña
        group.MapPatch("/{id:int}/clave", async (int id, CambiarClaveDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.NuevaClave) || dto.NuevaClave.Length < 4)
                return Results.BadRequest(new { mensaje = "La contraseña debe tener al menos 4 caracteres." });

            var padre = await db.Usuarios.FindAsync(id);
            if (padre is null || padre.RolId != ROL_PADRE) return Results.NotFound();

            padre.ClaveHash = dto.NuevaClave.Trim();
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("CambiarClavePadre");

        // ── PATCH /api/padres/{id}/estado  → toggle activo/inactivo
        group.MapPatch("/{id:int}/estado", async (int id, KumamotoDbContext db) =>
        {
            var padre = await db.Usuarios.FindAsync(id);
            if (padre is null || padre.RolId != ROL_PADRE) return Results.NotFound();
            padre.Estado = padre.Estado == 1 ? (short)0 : (short)1;
            await db.SaveChangesAsync();
            return Results.Ok(new { padre.Estado });
        }).WithName("TogglePadreEstado");

        // ── DELETE /api/padres/{id}  → eliminación lógica
        group.MapDelete("/{id:int}", async (int id, KumamotoDbContext db) =>
        {
            var padre = await db.Usuarios.FindAsync(id);
            if (padre is null || padre.RolId != ROL_PADRE) return Results.NotFound();
            padre.Estado = 0;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("DeletePadre");
    }
}
