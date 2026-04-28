using Kumamoto.API.Data;
using Kumamoto.API.DTOs;
using Kumamoto.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Endpoints;

public static class CursosEndpoints
{
    public static void MapCursosEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/cursos").WithTags("Cursos").RequireAuthorization();

        // GET /api/cursos  → todos los cursos con sus aulas asignadas
        group.MapGet("/", async (KumamotoDbContext db) =>
        {
            var cursos = await db.Cursos
                .OrderBy(c => c.Nombre)
                .ToListAsync();

            var cargas = await db.CargasAcademicas
                .Where(ca => ca.Estado == 1)
                .Include(ca => ca.Aula)
                    .ThenInclude(a => a!.Grado)
                .Include(ca => ca.Aula)
                    .ThenInclude(a => a!.Seccion)
                .ToListAsync();

            var result = cursos.Select(c => new CursoDetalleDto(
                c.Id, c.Nombre, c.Estado,
                cargas.Where(ca => ca.CursoId == c.Id)
                    .Select(ca => new AulaAsignadaDto(
                        ca.Id, ca.AulaId,
                        ca.Aula?.Grado?.Nombre ?? "",
                        ca.Aula?.Seccion?.Letra ?? "",
                        ca.Aula?.Descripcion
                    )).ToList()
            )).ToList();

            return Results.Ok(result);
        }).WithName("GetCursos");

        // ══════════════════════════════════════════════════════════════════
        //  GET /api/cursos/combo  → lista plana para selects (solo activos)
        // ══════════════════════════════════════════════════════════════════
        group.MapGet("/combo", async (KumamotoDbContext db) =>
        {
            var list = await db.Cursos
                .Where(c => c.Estado == 1)
                .OrderBy(c => c.Nombre)
                .Select(c => new CursoComboDto(c.Id, c.Nombre))
                .ToListAsync();
            return Results.Ok(list);
        }).WithName("GetCursosCombo");

        // ══════════════════════════════════════════════════════════════════
        //  POST /api/cursos  → crear curso
        // ══════════════════════════════════════════════════════════════════
        group.MapPost("/", async (CreateCursoDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Nombre))
                return Results.BadRequest(new { mensaje = "El nombre del curso es requerido." });

            var existe = await db.Cursos.AnyAsync(c => c.Nombre == dto.Nombre.Trim());
            if (existe)
                return Results.Conflict(new { mensaje = "Ya existe un curso con ese nombre." });

            var curso = new Curso { Nombre = dto.Nombre.Trim(), Estado = 1 };
            db.Cursos.Add(curso);
            await db.SaveChangesAsync();
            return Results.Created($"/api/cursos/{curso.Id}", new { curso.Id });
        }).WithName("CreateCurso");

        // ══════════════════════════════════════════════════════════════════
        //  PUT /api/cursos/{id}  → editar nombre
        // ══════════════════════════════════════════════════════════════════
        group.MapPut("/{id:int}", async (int id, UpdateCursoDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Nombre))
                return Results.BadRequest(new { mensaje = "El nombre es requerido." });

            var curso = await db.Cursos.FindAsync(id);
            if (curso is null) return Results.NotFound();

            var duplicado = await db.Cursos.AnyAsync(c => c.Nombre == dto.Nombre.Trim() && c.Id != id);
            if (duplicado)
                return Results.Conflict(new { mensaje = "Ya existe otro curso con ese nombre." });

            curso.Nombre = dto.Nombre.Trim();
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("UpdateCurso");

        // ══════════════════════════════════════════════════════════════════
        //  PATCH /api/cursos/{id}/estado  → toggle activo/inactivo
        // ══════════════════════════════════════════════════════════════════
        group.MapPatch("/{id:int}/estado", async (int id, KumamotoDbContext db) =>
        {
            var curso = await db.Cursos.FindAsync(id);
            if (curso is null) return Results.NotFound();
            curso.Estado = curso.Estado == 1 ? (short)0 : (short)1;
            await db.SaveChangesAsync();
            return Results.Ok(new { curso.Estado });
        }).WithName("ToggleCursoEstado");

        // ══════════════════════════════════════════════════════════════════
        //  DELETE /api/cursos/{id}  → eliminación lógica
        // ══════════════════════════════════════════════════════════════════
        group.MapDelete("/{id:int}", async (int id, KumamotoDbContext db) =>
        {
            var curso = await db.Cursos.FindAsync(id);
            if (curso is null) return Results.NotFound();
            curso.Estado = 0;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("DeleteCurso");

        // ══════════════════════════════════════════════════════════════════
        //  POST /api/cursos/{id}/asignar  → asignar curso a un aula
        // ══════════════════════════════════════════════════════════════════
        group.MapPost("/{id:int}/asignar", async (int id, AsignarAulaDto dto, KumamotoDbContext db) =>
        {
            var curso = await db.Cursos.FindAsync(id);
            if (curso is null) return Results.NotFound(new { mensaje = "Curso no encontrado." });

            var aula = await db.Aulas.FindAsync(dto.AulaId);
            if (aula is null) return Results.NotFound(new { mensaje = "Aula no encontrada." });

            // Evitar duplicado activo
            var duplicado = await db.CargasAcademicas
                .AnyAsync(ca => ca.CursoId == id && ca.AulaId == dto.AulaId && ca.Estado == 1);
            if (duplicado)
                return Results.Conflict(new { mensaje = "Este curso ya está asignado a esa aula." });

            var carga = new CargaAcademica
            {
                CursoId = id,
                AulaId = dto.AulaId,
                DocenteId = null,
                PeriodoLectivo = DateTime.Now.Year.ToString(),
                Estado = 1
            };
            db.CargasAcademicas.Add(carga);
            await db.SaveChangesAsync();
            return Results.Created($"/api/cursos/{id}", new { carga.Id });
        }).WithName("AsignarCursoAula");

        // ══════════════════════════════════════════════════════════════════
        //  DELETE /api/cursos/asignaciones/{cargaId}  → quitar asignación
        // ══════════════════════════════════════════════════════════════════
        group.MapDelete("/asignaciones/{cargaId:int}", async (int cargaId, KumamotoDbContext db) =>
        {
            var carga = await db.CargasAcademicas.FindAsync(cargaId);
            if (carga is null) return Results.NotFound();
            carga.Estado = 0;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("RemoverAsignacionCurso");
    }
}
