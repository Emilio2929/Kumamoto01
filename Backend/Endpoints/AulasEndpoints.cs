using Kumamoto.API.Data;
using Kumamoto.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Endpoints;

public static class AulasEndpoints
{
    public static void MapAulasEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/aulas").WithTags("Aulas").RequireAuthorization();

        // ── GET /api/aulas  → lista completa con detalle + tutor
        group.MapGet("/", async (KumamotoDbContext db) =>
        {
            var aulas = await db.Aulas
                .Include(a => a.Grado)
                .Include(a => a.Seccion)
                .Include(a => a.Tutor)
                .OrderBy(a => a.Grado!.Nombre)
                .ThenBy(a => a.Seccion!.Letra)
                .Select(a => new
                {
                    a.Id,
                    gradoNombre = a.Grado!.Nombre,
                    seccionLetra = a.Seccion!.Letra,
                    a.Descripcion,
                    a.Capacidad,
                    a.GradoId,
                    a.SeccionId,
                    a.Estado,
                    tutorId    = a.TutorId,
                    tutorNombre = a.Tutor != null ? $"{a.Tutor.Apellidos}, {a.Tutor.Nombres}" : null
                })
                .ToListAsync();

            return Results.Ok(aulas);
        })
        .WithName("GetAulas")
        .WithSummary("Lista completa de aulas con estado y tutor asignado");

        // ── PATCH /api/aulas/{id}/tutor  → asignar o quitar tutor docente
        group.MapPatch("/{id:int}/tutor", async (int id, AsignarTutorDto dto, KumamotoDbContext db) =>
        {
            var aula = await db.Aulas.FindAsync(id);
            if (aula is null) return Results.NotFound(new { mensaje = "Aula no encontrada." });

            if (dto.TutorId.HasValue)
            {
                // Verificar que el docente exista y sea rol Docente (rol_id = 2)
                var docente = await db.Usuarios.FirstOrDefaultAsync(u => u.Id == dto.TutorId.Value && u.RolId == 2 && u.Estado == 1);
                if (docente is null)
                    return Results.BadRequest(new { mensaje = "Docente no encontrado o inactivo." });
            }

            aula.TutorId = dto.TutorId; // null = quitar tutor
            await db.SaveChangesAsync();

            return Results.Ok(new { mensaje = dto.TutorId.HasValue ? "Tutor asignado correctamente." : "Tutor removido." });
        })
        .WithName("AsignarTutorAula")
        .WithSummary("Asignar o quitar docente tutor de un aula");



        // ── GET /api/aulas/combo  → lista plana {id, label} para combos externos
        group.MapGet("/combo", async (KumamotoDbContext db) =>
        {
            var aulas = await db.Aulas
                .Where(a => a.Estado == 1)
                .Include(a => a.Grado)
                .Include(a => a.Seccion)
                .OrderBy(a => a.Grado!.Nombre)
                .ThenBy(a => a.Seccion!.Letra)
                .Select(a => new AulaDto(a.Id, $"{a.Grado!.Nombre} – {a.Seccion!.Letra}"))
                .ToListAsync();

            return Results.Ok(aulas);
        })
        .WithName("GetAulasCombo")
        .WithSummary("Lista plana para combos");

        // ── GET /api/aulas/grados  → jerarquía grado → secciones (solo activos)
        group.MapGet("/grados", async (KumamotoDbContext db) =>
        {
            var grados = await db.Grados
                .Where(g => g.Estado == 1)
                .Include(g => g.Aulas.Where(a => a.Estado == 1))
                    .ThenInclude(a => a.Seccion)
                .OrderBy(g => g.Nombre)
                .Select(g => new GradoConSeccionesDto(
                    g.Id,
                    g.Nombre,
                    g.Aulas.Select(a => new SeccionDto(a.SeccionId, a.Seccion!.Letra)).ToList()
                ))
                .ToListAsync();

            return Results.Ok(grados);
        })
        .WithName("GetGradosConSecciones")
        .WithSummary("Grados con sus secciones anidadas");

        // ── GET /api/aulas/dropdowns  → grados y secciones para formularios
        group.MapGet("/dropdowns", async (KumamotoDbContext db) =>
        {
            var grados = await db.Grados
                .Where(g => g.Estado == 1)
                .OrderBy(g => g.Nombre)
                .Select(g => new GradoSimpleDto(g.Id, g.Nombre))
                .ToListAsync();

            var secciones = await db.Secciones
                .Where(s => s.Estado == 1)
                .OrderBy(s => s.Letra)
                .Select(s => new SeccionSimpleDto(s.Id, s.Letra))
                .ToListAsync();

            return Results.Ok(new { grados, secciones });
        })
        .WithName("GetDropdowns")
        .WithSummary("Grados y secciones para formularios");

        // ── POST /api/aulas  → crear aula
        group.MapPost("/", async (CreateAulaDto dto, KumamotoDbContext db) =>
        {
            // Validar unicidad grado+seccion
            var existe = await db.Aulas.AnyAsync(a => a.GradoId == dto.GradoId && a.SeccionId == dto.SeccionId);
            if (existe)
                return Results.Conflict(new { mensaje = "Ya existe un aula con ese Grado y Sección." });

            var aula = new Kumamoto.API.Models.Aula
            {
                GradoId = dto.GradoId,
                SeccionId = dto.SeccionId,
                Descripcion = dto.Descripcion,
                Capacidad = dto.Capacidad,
                Estado = 1
            };

            db.Aulas.Add(aula);
            await db.SaveChangesAsync();
            return Results.Created($"/api/aulas/{aula.Id}", new { aula.Id });
        })
        .WithName("CreateAula")
        .WithSummary("Crear nueva aula");

        // ── PUT /api/aulas/{id}  → editar aula
        group.MapPut("/{id:int}", async (int id, UpdateAulaDto dto, KumamotoDbContext db) =>
        {
            var aula = await db.Aulas.FindAsync(id);
            if (aula is null) return Results.NotFound();

            // Validar que la combinación grado+seccion no la use otra aula
            var duplicada = await db.Aulas.AnyAsync(a => a.GradoId == dto.GradoId && a.SeccionId == dto.SeccionId && a.Id != id);
            if (duplicada)
                return Results.Conflict(new { mensaje = "Ya existe otra aula con ese Grado y Sección." });

            aula.GradoId = dto.GradoId;
            aula.SeccionId = dto.SeccionId;
            aula.Descripcion = dto.Descripcion;
            aula.Capacidad = dto.Capacidad;

            await db.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateAula")
        .WithSummary("Editar aula existente");

        // ── PATCH /api/aulas/{id}/estado  → activar / desactivar (toggle)
        group.MapPatch("/{id:int}/estado", async (int id, KumamotoDbContext db) =>
        {
            var aula = await db.Aulas.FindAsync(id);
            if (aula is null) return Results.NotFound();

            aula.Estado = aula.Estado == 1 ? (short)0 : (short)1;
            await db.SaveChangesAsync();
            return Results.Ok(new { aula.Estado });
        })
        .WithName("ToggleAulaEstado")
        .WithSummary("Activar o desactivar aula");

        // ── DELETE /api/aulas/{id}  → eliminación lógica (Estado = 0)
        group.MapDelete("/{id:int}", async (int id, KumamotoDbContext db) =>
        {
            var aula = await db.Aulas.FindAsync(id);
            if (aula is null) return Results.NotFound();

            aula.Estado = 0;
            await db.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteAula")
        .WithSummary("Eliminación lógica de aula");
    }
}

