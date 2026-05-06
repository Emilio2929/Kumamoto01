using Kumamoto.API.Data;
using Kumamoto.API.Models;
using Kumamoto.API.Services;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Kumamoto.API.Endpoints;

public static class DocentePortalEndpoints
{
    public static void MapDocentePortalEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/docente-portal").WithTags("Portal Docente").RequireAuthorization();

        // ── GET /api/docente-portal/clase-actual
        group.MapGet("/clase-actual", async (ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            // 1. Obtener día y hora actual
            var now = DateTime.Now;
            var diaSpanish = GetDiaSemanaSpanish(now.DayOfWeek);
            var horaActual = TimeOnly.FromDateTime(now);

            // 2. Buscar si hay una carga académica con horario activo ahora
            var horarioActivo = await db.HorarioDetalle
                .Include(h => h.Carga).ThenInclude(c => c!.Curso)
                .Include(h => h.Carga).ThenInclude(c => c!.Aula).ThenInclude(a => a!.Grado)
                .Include(h => h.Carga).ThenInclude(c => c!.Aula).ThenInclude(a => a!.Seccion)
                .Where(h => h.Carga!.DocenteId == userId && 
                            h.DiaSemana == diaSpanish && 
                            h.HoraInicio <= horaActual && 
                            h.HoraFin >= horaActual &&
                            h.Estado == 1)
                .FirstOrDefaultAsync();

            if (horarioActivo?.Carga == null)
            {
                return Results.Ok(new { activa = false, mensaje = "No tienes clases programadas en este bloque horario." });
            }

            var carga = horarioActivo.Carga;

            // 3. Obtener lista de estudiantes del aula
            var estudiantes = await db.Estudiantes
                .Where(e => e.AulaId == carga.AulaId && e.Estado == 1)
                .OrderBy(e => e.Apellidos).ThenBy(e => e.Nombres)
                .Select(e => new { e.Id, NombreCompleto = $"{e.Apellidos}, {e.Nombres}" })
                .ToListAsync();

            return Results.Ok(new
            {
                activa = true,
                cargaId = carga.Id,
                aulaId = carga.AulaId,
                curso = carga.Curso?.Nombre,
                grado = carga.Aula?.Grado?.Nombre,
                seccion = carga.Aula?.Seccion?.Letra,
                estudiantes
            });
        }).WithName("GetClaseActualDocente");

        // ── POST /api/docente-portal/registrar-asistencia
        group.MapPost("/registrar-asistencia", async (AsistenciaDocenteRequest request, ClaimsPrincipal user, KumamotoDbContext db, EarlyWarningService earlyWarning) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            if (request.Estudiantes == null || !request.Estudiantes.Any())
                return Results.BadRequest(new { mensaje = "Debe marcar la asistencia de al menos un estudiante." });

            var hoy = DateOnly.FromDateTime(DateTime.Now);

            foreach (var item in request.Estudiantes)
            {
                var asistencia = new Asistencia
                {
                    EstudianteId = item.EstudianteId,
                    RegistradoPorId = userId.Value,
                    CargaAcademicaId = request.CargaId,
                    Fecha = hoy,
                    Valor = item.Presente ? "P" : "F",
                    Estado = 1
                };
                db.Asistencias.Add(asistencia);
            }

            await db.SaveChangesAsync();

            // Recalcular riesgo académico en tiempo real (Variable VD1)
            foreach (var item in request.Estudiantes)
            {
                await earlyWarning.RecalcularRiesgoAcademico(item.EstudianteId);
            }

            return Results.Ok(new { mensaje = "Asistencia registrada exitosamente y riesgo recalculado." });
        }).WithName("RegistrarAsistenciaDocente");
    }

    private static int? GetUserId(ClaimsPrincipal user)
    {
        var claim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value;
        if (int.TryParse(claim, out var id)) return id;
        return null;
    }

    private static string GetDiaSemanaSpanish(DayOfWeek day) => day switch
    {
        DayOfWeek.Monday => "Lunes",
        DayOfWeek.Tuesday => "Martes",
        DayOfWeek.Wednesday => "Miércoles",
        DayOfWeek.Thursday => "Jueves",
        DayOfWeek.Friday => "Viernes",
        DayOfWeek.Saturday => "Sábado",
        DayOfWeek.Sunday => "Domingo",
        _ => ""
    };
}

public record AsistenciaDocenteRequest(int CargaId, List<EstudianteAsistenciaItem> Estudiantes);
public record EstudianteAsistenciaItem(int EstudianteId, bool Presente);
