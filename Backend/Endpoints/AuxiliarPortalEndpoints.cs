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

            // Validar curso obligatorio
            if (cargaId == null) return Results.BadRequest(new { mensaje = "El curso es obligatorio para generar el reporte." });

            // Verificar permiso
            var tieneAcceso = await db.AsignacionesAuxiliar.AnyAsync(a => a.AuxiliarId == userId && a.AulaId == aulaId && a.Estado == 1);
            if (!tieneAcceso) return Results.Forbid();

            var fechaInicio = inicio ?? DateOnly.FromDateTime(DateTime.Today.AddDays(-30));
            var fechaFin = fin ?? DateOnly.FromDateTime(DateTime.Today);

            // Obtener nombre del curso
            var nombreCurso = await db.CargasAcademicas
                .Include(c => c.Curso)
                .Where(c => c.Id == cargaId.Value)
                .Select(c => c.Curso!.Nombre)
                .FirstOrDefaultAsync() ?? "Curso";

            // Obtener TODOS los estudiantes del aula (para que salgan aunque no tengan asistencia)
            var estudiantes = await db.Estudiantes
                .Where(e => e.AulaId == aulaId && e.Estado == 1)
                .OrderBy(e => e.Apellidos)
                .Select(e => new { e.Id, Nombre = $"{e.Apellidos}, {e.Nombres}" })
                .ToListAsync();

            // Obtener asistencias filtradas
            var asistencias = await db.Asistencias
                .Where(a => a.Fecha >= fechaInicio && a.Fecha <= fechaFin && 
                            a.CargaAcademicaId == cargaId.Value && 
                            a.Estado == 1)
                .Select(a => new {
                    estudianteId = a.EstudianteId,
                    fecha = a.Fecha,
                    valor = a.Valor
                })
                .ToListAsync();

            return Results.Ok(new
            {
                estudiantes,
                asistencias,
                cursoNombre = nombreCurso,
                periodo = $"{fechaInicio:dd/MM/yyyy} - {fechaFin:dd/MM/yyyy}"
            });
        }).WithName("GetAuxiliarReporteAsistencia");
    }

    private static int? GetUserId(ClaimsPrincipal user)
    {
        var claim = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        if (int.TryParse(claim, out var id)) return id;
        return null;
    }
}
