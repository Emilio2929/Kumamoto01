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

        // ── GET /api/docente-portal/clases-hoy
        group.MapGet("/clases-hoy", async (ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            var diaSpanish = GetDiaSemanaSpanish(DateTime.Now.DayOfWeek);

            var clases = await db.HorarioDetalle
                .Include(h => h.Carga).ThenInclude(c => c!.Curso)
                .Include(h => h.Carga).ThenInclude(c => c!.Aula).ThenInclude(a => a!.Grado)
                .Include(h => h.Carga).ThenInclude(c => c!.Aula).ThenInclude(a => a!.Seccion)
                .Where(h => h.Carga!.DocenteId == userId && 
                            h.DiaSemana == diaSpanish && 
                            h.Estado == 1)
                .OrderBy(h => h.HoraInicio)
                .Select(h => new 
                {
                    cargaId = h.Carga!.Id,
                    curso = h.Carga.Curso!.Nombre,
                    grado = h.Carga.Aula!.Grado!.Nombre,
                    seccion = h.Carga.Aula.Seccion!.Letra,
                    horaInicio = h.HoraInicio.ToString("HH:mm"),
                    horaFin = h.HoraFin.ToString("HH:mm")
                })
                .ToListAsync();

            return Results.Ok(clases);
        }).WithName("GetClasesHoyDocente");

        // ── GET /api/docente-portal/estudiantes-carga/{cargaId}
        group.MapGet("/estudiantes-carga/{cargaId}", async (int cargaId, ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            var carga = await db.CargasAcademicas.FirstOrDefaultAsync(c => c.Id == cargaId && c.DocenteId == userId);
            if (carga == null) return Results.NotFound();

            var hoy = DateOnly.FromDateTime(DateTime.Today);
            var asistenciasHoy = await db.Asistencias
                .Where(a => a.CargaAcademicaId == cargaId && a.Fecha == hoy && a.Estado == 1)
                .ToDictionaryAsync(a => a.EstudianteId, a => a.Valor);

            var estudiantes = await db.Estudiantes
                .Where(e => e.AulaId == carga.AulaId && e.Estado == 1)
                .OrderBy(e => e.Apellidos).ThenBy(e => e.Nombres)
                .Select(e => new { 
                    e.Id, 
                    NombreCompleto = $"{e.Apellidos}, {e.Nombres}",
                    valorActual = asistenciasHoy.ContainsKey(e.Id) ? asistenciasHoy[e.Id] : null
                })
                .ToListAsync();

            return Results.Ok(estudiantes);
        }).WithName("GetEstudiantesCargaDocente");

        // ── POST /api/docente-portal/registrar-asistencia
        group.MapPost("/registrar-asistencia", async (AsistenciaDocenteRequest request, ClaimsPrincipal user, KumamotoDbContext db, AlertaTempranaService alertaTempranaService) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            if (request.Estudiantes == null || !request.Estudiantes.Any())
                return Results.BadRequest(new { mensaje = "Debe marcar la asistencia." });

            var hoy = DateOnly.FromDateTime(DateTime.Now);

            // Buscamos asistencias previas para este bloque/día para actualizarlas en lugar de duplicarlas
            var existentes = await db.Asistencias
                .Where(a => a.CargaAcademicaId == request.CargaId && a.Fecha == hoy && a.Estado == 1)
                .ToListAsync();
            var mapExist = existentes.ToDictionary(a => a.EstudianteId);

            foreach (var item in request.Estudiantes)
            {
                if (mapExist.TryGetValue(item.EstudianteId, out var reg))
                {
                    // Actualizar registro compartido
                    reg.Valor = item.Valor;
                    reg.RegistradoPorId = userId.Value; // El último en modificar
                }
                else
                {
                    // Crear nuevo si no existe
                    var asistencia = new Asistencia
                    {
                        EstudianteId = item.EstudianteId,
                        RegistradoPorId = userId.Value,
                        CargaAcademicaId = request.CargaId,
                        Fecha = hoy,
                        Valor = item.Valor,
                        Estado = 1
                    };
                    db.Asistencias.Add(asistencia);
                }
            }

            await db.SaveChangesAsync();

            // Recalcular riesgo académico en tiempo real (Cerebro Alerta Temprana)
            foreach (var item in request.Estudiantes)
            {
                await alertaTempranaService.RecalcularRiesgoAcademico(item.EstudianteId);
            }

            return Results.Ok(new { mensaje = "Asistencia registrada exitosamente." });
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
public record EstudianteAsistenciaItem(int EstudianteId, string Valor);
