using System.Security.Claims;
using Kumamoto.API.Data;
using Kumamoto.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Endpoints;

public static class AuxiliarPortalEndpoints
{
    public static void MapAuxiliarPortalEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auxiliar-portal").WithTags("Portal Auxiliar").RequireAuthorization();

        // ── CURSOS POR AULA ──────────────────────────────────────────────────
        group.MapGet("/aulas/{aulaId:int}/cursos", async (int aulaId, KumamotoDbContext db) =>
        {
            var cursos = await db.CargasAcademicas
                .Where(ca => ca.AulaId == aulaId && ca.Estado == 1)
                .Include(ca => ca.Curso)
                .OrderBy(ca => ca.Curso!.Nombre)
                .Select(ca => new { id = ca.Id, nombre = ca.Curso!.Nombre })
                .ToListAsync();
            return Results.Ok(cursos);
        }).WithName("GetCursosByAulaAuxiliar");

        // ── DASHBOARD STATS ──────────────────────────────────────────────────
        group.MapGet("/dashboard-stats", async (ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId == null) return Results.Unauthorized();

            // Aulas asignadas
            var aulaIds = await db.AsignacionesAuxiliar
                .Where(a => a.AuxiliarId == userId && a.Estado == 1)
                .Select(a => a.AulaId)
                .ToListAsync();

            if (!aulaIds.Any()) return Results.Ok(new { sinAsignacion = true });

            var totalEstudiantes = await db.Estudiantes
                .CountAsync(e => e.AulaId != null && aulaIds.Contains(e.AulaId.Value) && e.Estado == 1);

            var hoy = DateOnly.FromDateTime(DateTime.Today);
            
            // Asistencia de hoy en sus aulas
            var asistenciasHoy = await db.Asistencias
                .Where(a => a.Fecha == hoy && a.Estado == 1)
                .Join(db.Estudiantes, 
                    asist => asist.EstudianteId, 
                    est => est.Id, 
                    (asist, est) => new { asist, est })
                .Where(x => x.est.AulaId != null && aulaIds.Contains(x.est.AulaId.Value))
                .Select(x => x.asist)
                .ToListAsync();

            var presentesHoy = asistenciasHoy.Count(a => a.Valor == "P");
            var totalMarcados = asistenciasHoy.Count();

            var porcentajeAsistencia = totalMarcados > 0 
                ? Math.Round((double)presentesHoy / totalMarcados * 100, 1) 
                : 0.0;

            // Alertas en sus aulas
            var alertas = await db.AlertasRiesgo
                .Include(a => a.Estudiante)
                .Where(a => a.Estudiante!.AulaId != null && 
                            aulaIds.Contains(a.Estudiante.AulaId.Value) && 
                            a.Estado == 1)
                .OrderByDescending(a => a.NivelRiesgo == "Alto")
                .ThenByDescending(a => a.NivelRiesgo == "Medio")
                .Take(5)
                .Select(a => new {
                    estudiante = $"{a.Estudiante!.Apellidos}, {a.Estudiante.Nombres}",
                    riesgo = a.NivelRiesgo,
                    causa = a.Motivo
                })
                .ToListAsync();

            return Results.Ok(new
            {
                totalAulas = aulaIds.Count,
                totalEstudiantes,
                asistenciaHoy = porcentajeAsistencia,
                alertas,
                aulasAsignadas = await db.Aulas
                    .Where(a => aulaIds.Contains(a.Id))
                    .Include(a => a.Grado)
                    .Include(a => a.Seccion)
                    .Select(a => new { a.Id, nombre = $"{a.Grado!.Nombre} {a.Seccion!.Letra}" })
                    .ToListAsync()
            });
        }).WithName("GetAuxiliarDashboardStats");

        // ── REPORTE ASISTENCIA POR AULA ──────────────────────────────────────
        group.MapGet("/reporte-asistencia/{aulaId:int}", async (int aulaId, DateOnly? inicio, DateOnly? fin, int? cargaId, ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId == null) return Results.Unauthorized();

            // Verificar permiso
            var tieneAcceso = await db.AsignacionesAuxiliar.AnyAsync(a => a.AuxiliarId == userId && a.AulaId == aulaId && a.Estado == 1);
            if (!tieneAcceso) return Results.Forbid();

            var fechaInicio = inicio ?? DateOnly.FromDateTime(DateTime.Today.AddDays(-30));
            var fechaFin = fin ?? DateOnly.FromDateTime(DateTime.Today);

            // Obtener nombre del curso (o Todos)
            var nombreCurso = cargaId.HasValue 
                ? await db.CargasAcademicas
                    .Include(c => c.Curso)
                    .Where(c => c.Id == cargaId.Value)
                    .Select(c => c.Curso!.Nombre)
                    .FirstOrDefaultAsync() ?? "Curso"
                : "Todos los Cursos";

            // Obtener TODOS los estudiantes del aula (para que salgan aunque no tengan asistencia)
            var estudiantes = await db.Estudiantes
                .Where(e => e.AulaId == aulaId && e.Estado == 1)
                .OrderBy(e => e.Apellidos)
                .Select(e => new { e.Id, Nombre = $"{e.Apellidos}, {e.Nombres}" })
                .ToListAsync();

            // Obtener asistencias filtradas
            var asistencias = await db.Asistencias
                .Where(a => a.Fecha >= fechaInicio && a.Fecha <= fechaFin && 
                            (!cargaId.HasValue || a.CargaAcademicaId == cargaId.Value) && 
                            a.Estado == 1)
                .Select(a => new {
                    estudianteId = a.EstudianteId,
                    fecha = a.Fecha,
                    valor = a.Valor
                })
                .ToListAsync();

            // Obtener cursos disponibles en esta aula
            var cursos = await db.CargasAcademicas
                .Include(c => c.Curso)
                .Where(c => c.AulaId == aulaId && c.Estado == 1)
                .Select(c => new { cargaId = c.Id, nombre = c.Curso!.Nombre })
                .ToListAsync();

            return Results.Ok(new
            {
                estudiantes,
                asistencias,
                cursos,
                cursoNombre = nombreCurso,
                periodo = $"{fechaInicio:dd/MM/yyyy} - {fechaFin:dd/MM/yyyy}"
            });
        }).WithName("GetAuxiliarReporteAsistencia");

        // ── BUSCAR ESTUDIANTES (INCIDENCIAS) ─────────────────────────────────
        group.MapGet("/estudiantes-buscar", async (int? aulaId, int? cargaId, string? query, ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId == null) return Results.Unauthorized();

            var q = db.Estudiantes.Include(e => e.Aula).ThenInclude(a => a!.Grado)
                                  .Include(e => e.Aula).ThenInclude(a => a!.Seccion)
                                  .Where(e => e.Estado == 1).AsQueryable();

            if (aulaId.HasValue && aulaId.Value > 0)
            {
                q = q.Where(e => e.AulaId == aulaId.Value);
            }

            if (!string.IsNullOrWhiteSpace(query))
            {
                var term = query.Trim().ToLower();
                q = q.Where(e => e.Nombres.ToLower().Contains(term) || e.Apellidos.ToLower().Contains(term));
            }

            var estudiantes = await q.OrderBy(e => e.Apellidos).ThenBy(e => e.Nombres)
                .Select(e => new {
                    id = e.Id,
                    nombre = $"{e.Apellidos}, {e.Nombres}",
                    aulaNombre = e.Aula != null ? $"{e.Aula.Grado!.Nombre} {e.Aula.Seccion!.Letra}" : "Sin Aula"
                })
                .Take(50)
                .ToListAsync();

            return Results.Ok(estudiantes);
        }).WithName("BuscarEstudiantesAuxiliar");

        // ── HISTORIAL DE INCIDENCIAS (AUXILIAR) ──────────────────────────────
        group.MapGet("/incidencias", async (int? aulaId, string? query, ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId == null) return Results.Unauthorized();

            // Aulas asignadas al auxiliar
            var misAulas = await db.AsignacionesAuxiliar
                .Where(a => a.AuxiliarId == userId && a.Estado == 1)
                .Select(a => a.AulaId)
                .ToListAsync();

            var q = db.Incidencias
                .Include(i => i.Estudiante).ThenInclude(e => e!.Aula).ThenInclude(a => a!.Grado)
                .Include(i => i.Estudiante).ThenInclude(e => e!.Aula).ThenInclude(a => a!.Seccion)
                .Where(i => i.Estado == 1 && i.Estudiante!.AulaId != null && misAulas.Contains(i.Estudiante.AulaId.Value))
                .AsQueryable();

            if (aulaId.HasValue && aulaId.Value > 0)
            {
                q = q.Where(i => i.Estudiante!.AulaId == aulaId.Value);
            }

            if (!string.IsNullOrWhiteSpace(query))
            {
                var term = query.Trim().ToLower();
                q = q.Where(i => (i.Estudiante != null && i.Estudiante.Nombres != null && i.Estudiante.Nombres.ToLower().Contains(term)) || 
                                 (i.Estudiante != null && i.Estudiante.Apellidos != null && i.Estudiante.Apellidos.ToLower().Contains(term)) || 
                                 (i.TipoIncidencia != null && i.TipoIncidencia.ToLower().Contains(term)));
            }

            var incidencias = await q.OrderByDescending(i => i.FechaRegistro)
                .Select(i => new {
                    id = i.Id,
                    estudianteNombre = i.Estudiante != null ? $"{i.Estudiante.Apellidos}, {i.Estudiante.Nombres}" : "Desconocido",
                    aulaNombre = i.Estudiante != null && i.Estudiante.Aula != null ? $"{i.Estudiante.Aula.Grado!.Nombre} {i.Estudiante.Aula.Seccion!.Letra}" : "Sin Aula",
                    tipoIncidencia = i.TipoIncidencia ?? "Otro",
                    descripcion = i.Descripcion,
                    fecha = i.FechaRegistro
                })
                .Take(100)
                .ToListAsync();

            return Results.Ok(incidencias);
        }).WithName("GetIncidenciasAuxiliar");
    }

    private static int? GetUserId(ClaimsPrincipal user)
    {
        var claim = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        if (int.TryParse(claim, out var id)) return id;
        return null;
    }
}
