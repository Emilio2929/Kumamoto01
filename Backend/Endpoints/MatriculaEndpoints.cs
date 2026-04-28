using Kumamoto.API.Data;
using Kumamoto.API.DTOs;
using Kumamoto.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Endpoints;

public static class MatriculaEndpoints
{
    private const int ROL_PADRE = 4;

    public static void MapMatriculaEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/matricula").WithTags("Matrícula").RequireAuthorization();

        // ── GET /api/matricula  → todos los estudiantes con aula y padre
        group.MapGet("/", async (KumamotoDbContext db) =>
        {
            var estudiantes = await db.Estudiantes
                .Include(e => e.Aula).ThenInclude(a => a!.Grado)
                .Include(e => e.Aula).ThenInclude(a => a!.Seccion)
                .Include(e => e.Padre)
                .OrderBy(e => e.Apellidos).ThenBy(e => e.Nombres)
                .Select(e => new EstudianteDetalleDto(
                    e.Id, e.Dni, e.Nombres, e.Apellidos, e.Correo, e.Telefono,
                    e.AulaId,
                    e.Aula != null ? e.Aula.Grado!.Nombre : null,
                    e.Aula != null ? e.Aula.Seccion!.Letra : null,
                    e.Aula != null ? e.Aula.Descripcion : null,
                    e.PadreId,
                    e.Padre != null ? $"{e.Padre.Nombres} {e.Padre.Apellidos}" : null,
                    e.Padre != null ? e.Padre.Correo : null,
                    e.Estado
                ))
                .ToListAsync();

            return Results.Ok(estudiantes);
        }).WithName("GetEstudiantes");

        // ── GET /api/matricula/padres-combo  → padres activos para dropdown
        group.MapGet("/padres-combo", async (KumamotoDbContext db) =>
        {
            var padres = await db.Usuarios
                .Where(u => u.RolId == ROL_PADRE && u.Estado == 1)
                .OrderBy(u => u.Apellidos)
                .Select(u => new PadreComboDto(u.Id, $"{u.Nombres} {u.Apellidos}", u.Correo))
                .ToListAsync();
            return Results.Ok(padres);
        }).WithName("GetPadresCombo");

        // ── POST /api/matricula  → registrar y matricular estudiante
        group.MapPost("/", async (CreateEstudianteDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Dni) || dto.Dni.Length != 8)
                return Results.BadRequest(new { mensaje = "El DNI debe tener 8 dígitos." });
            if (string.IsNullOrWhiteSpace(dto.Nombres))
                return Results.BadRequest(new { mensaje = "Los nombres son requeridos." });
            if (string.IsNullOrWhiteSpace(dto.Apellidos))
                return Results.BadRequest(new { mensaje = "Los apellidos son requeridos." });

            // DNI único en tabla Estudiante
            var existeEstudiante = await db.Estudiantes.AnyAsync(e => e.Dni == dto.Dni);
            if (existeEstudiante)
                return Results.Conflict(new { mensaje = "Ya existe un estudiante con ese DNI." });

            // DNI único en tabla Usuario (padres, docentes, directores)
            var existeUsuario = await db.Usuarios.AnyAsync(u => u.Dni == dto.Dni);
            if (existeUsuario)
                return Results.Conflict(new { mensaje = "El DNI ya está registrado como usuario del sistema (padre/docente/director)." });

            var estudiante = new Estudiante
            {
                Dni = dto.Dni.Trim(),
                Nombres = dto.Nombres.Trim(),
                Apellidos = dto.Apellidos.Trim(),
                Correo = dto.Correo?.Trim(),
                Telefono = dto.Telefono?.Trim(),
                AulaId = dto.AulaId,
                PadreId = dto.PadreId,
                Estado = 1
            };
            db.Estudiantes.Add(estudiante);
            await db.SaveChangesAsync();

            return Results.Created($"/api/matricula/{estudiante.Id}", new { estudiante.Id });
        }).WithName("CreateEstudiante");

        // ── PUT /api/matricula/{id}  → actualizar datos y/o aula
        group.MapPut("/{id:int}", async (int id, UpdateEstudianteDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Nombres))
                return Results.BadRequest(new { mensaje = "Los nombres son requeridos." });
            if (string.IsNullOrWhiteSpace(dto.Apellidos))
                return Results.BadRequest(new { mensaje = "Los apellidos son requeridos." });

            var estudiante = await db.Estudiantes.FindAsync(id);
            if (estudiante is null) return Results.NotFound();

            estudiante.Nombres = dto.Nombres.Trim();
            estudiante.Apellidos = dto.Apellidos.Trim();
            estudiante.Correo = dto.Correo?.Trim();
            estudiante.Telefono = dto.Telefono?.Trim();
            estudiante.AulaId = dto.AulaId;
            estudiante.PadreId = dto.PadreId;
            await db.SaveChangesAsync();

            return Results.NoContent();
        }).WithName("UpdateEstudiante");

        // ── PATCH /api/matricula/{id}/estado  → toggle activo/inactivo
        group.MapPatch("/{id:int}/estado", async (int id, KumamotoDbContext db) =>
        {
            var e = await db.Estudiantes.FindAsync(id);
            if (e is null) return Results.NotFound();
            e.Estado = e.Estado == 1 ? (short)0 : (short)1;
            await db.SaveChangesAsync();
            return Results.Ok(new { e.Estado });
        }).WithName("ToggleEstudianteEstado");

        // ── DELETE /api/matricula/{id}  → eliminación lógica
        group.MapDelete("/{id:int}", async (int id, KumamotoDbContext db) =>
        {
            var e = await db.Estudiantes.FindAsync(id);
            if (e is null) return Results.NotFound();
            e.Estado = 0;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("DeleteEstudiante");
    }
}
