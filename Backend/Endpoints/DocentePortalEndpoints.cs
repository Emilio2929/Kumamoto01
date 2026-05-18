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

        // ── GET /api/docente-portal/mis-tutorias
        group.MapGet("/mis-tutorias", async (ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            var tutorias = await db.Aulas
                .Include(a => a.Grado)
                .Include(a => a.Seccion)
                .Where(a => a.TutorId == userId && a.Estado == 1)
                .Select(a => new
                {
                    a.Id,
                    a.Descripcion,
                    Grado = a.Grado!.Nombre,
                    Seccion = a.Seccion!.Letra,
                    NombreAula = $"{a.Grado.Nombre} {a.Seccion.Letra}"
                })
                .ToListAsync();

            return Results.Ok(tutorias);
        }).WithName("GetMisTutoriasDocente");

        // ── GET /api/docente-portal/tutoria/{aulaId}/detalles
        group.MapGet("/tutoria/{aulaId}/detalles", async (int aulaId, ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            // Verificar que el docente sea realmente el tutor de esta aula
            var aula = await db.Aulas
                .Include(a => a.Grado)
                .Include(a => a.Seccion)
                .FirstOrDefaultAsync(a => a.Id == aulaId && a.TutorId == userId && a.Estado == 1);

            if (aula == null) return Results.NotFound(new { mensaje = "No se encontró el aula o no tiene permisos de tutoría." });

            var estudiantes = await db.Estudiantes
                .Where(e => e.AulaId == aulaId && e.Estado == 1)
                .OrderBy(e => e.Apellidos).ThenBy(e => e.Nombres)
                .Select(e => new
                {
                    e.Id,
                    Codigo = e.Dni,
                    NombreCompleto = $"{e.Apellidos}, {e.Nombres}"
                })
                .ToListAsync();

            var estudianteIds = estudiantes.Select(e => e.Id).ToList();

            var incidencias = await db.Incidencias
                .Include(i => i.Estudiante)
                .Include(i => i.RegistradoPor)
                .Where(i => estudianteIds.Contains(i.EstudianteId) && i.Estado == 1)
                .OrderByDescending(i => i.FechaRegistro)
                .Select(i => new
                {
                    i.Id,
                    Estudiante = $"{i.Estudiante!.Apellidos}, {i.Estudiante.Nombres}",
                    RegistradoPor = $"{i.RegistradoPor!.Nombres} {i.RegistradoPor.Apellidos}",
                    i.TipoIncidencia,
                    i.Descripcion,
                    Fecha = i.FechaRegistro.ToString("yyyy-MM-dd HH:mm")
                })
                .ToListAsync();

            // Obtener todos los cursos asignados a esta aula
            var cursosAula = await db.CargasAcademicas
                .Where(c => c.AulaId == aulaId && c.Estado == 1)
                .Include(c => c.Curso)
                .Where(c => c.Curso != null)
                .Select(c => c.Curso!.Nombre)
                .Distinct()
                .ToListAsync();

            // Obtener todas las competencias de los cursos de esta aula
            var competenciasAula = await db.Competencias
                .Include(c => c.Curso)
                .Include(c => c.Carga).ThenInclude(ca => ca!.Curso)
                .Where(c => c.Estado == 1)
                .ToListAsync();

            var competenciasFiltradas = competenciasAula.Where(c => 
                (c.Curso != null && cursosAula.Contains(c.Curso.Nombre)) ||
                (c.Carga?.Curso != null && cursosAula.Contains(c.Carga.Curso.Nombre))
            ).Select(c => new {
                Id = c.Id,
                Nombre = c.Nombre,
                Curso = c.Curso != null ? c.Curso.Nombre : c.Carga!.Curso!.Nombre
            }).ToList();

            // Notas bimestrales (CalificacionBimestral) de todos los cursos y bimestres para los estudiantes del aula
            var notasBimestrales = await db.CalificacionesBimestrales
                .Include(c => c.Competencia!).ThenInclude(comp => comp.Curso)
                .Include(c => c.Competencia!).ThenInclude(comp => comp.Carga!).ThenInclude(ca => ca.Curso)
                .Include(c => c.Periodo)
                .Include(c => c.Escala)
                .Where(c => estudianteIds.Contains(c.EstudianteId) && c.Estado == 1)
                .Select(c => new
                {
                    c.EstudianteId,
                    CompetenciaId = c.CompetenciaId,
                    Competencia = c.Competencia!.Nombre,
                    Curso = c.Competencia.Curso != null ? c.Competencia.Curso.Nombre : 
                            (c.Competencia.Carga!.Curso != null ? c.Competencia.Carga.Curso.Nombre : "Curso General"),
                    Bimestre = c.Periodo!.Nombre,
                    Letra = c.Escala!.Letra,
                    c.Escala.Significado
                })
                .ToListAsync();

            // Construir rendimiento por cursos asegurando que todos los cursos del aula aparezcan
            var notasAgrupadas = notasBimestrales.GroupBy(n => n.Curso).ToDictionary(g => g.Key, g => g.ToList());
            var rendimientoCursos = cursosAula.Select(curso => new
            {
                Curso = curso,
                Promedio = notasAgrupadas.ContainsKey(curso) && notasAgrupadas[curso].Any() ? 
                           Math.Round(notasAgrupadas[curso].Average(x => x.Letra == "AD" ? 20.0 : (x.Letra == "A" ? 17.0 : (x.Letra == "B" ? 13.0 : 10.0))), 1) : 0.0
            }).ToList();

            // Notas semanales (Calificacion) de todos los cursos y semanas para los estudiantes del aula
            var notasSemanales = await db.Calificaciones
                .Include(c => c.Competencia!).ThenInclude(comp => comp.Curso)
                .Include(c => c.Competencia!).ThenInclude(comp => comp.Carga!).ThenInclude(ca => ca.Curso)
                .Include(c => c.Semana!).ThenInclude(s => s.Periodo)
                .Include(c => c.Escala)
                .Where(c => c.EstudianteId.HasValue && estudianteIds.Contains(c.EstudianteId.Value) && c.Estado == 1)
                .Select(c => new
                {
                    EstudianteId = c.EstudianteId!.Value,
                    CompetenciaId = c.CompetenciaId,
                    Competencia = c.Competencia!.Nombre,
                    Curso = c.Competencia.Curso != null ? c.Competencia.Curso.Nombre : 
                            (c.Competencia.Carga!.Curso != null ? c.Competencia.Carga.Curso.Nombre : "Curso General"),
                    Bimestre = c.Semana!.Periodo != null ? c.Semana.Periodo.Nombre : "Bimestre I",
                    Semana = c.Semana.NumeroSemana,
                    Letra = c.Escala!.Letra,
                    c.Escala.Significado
                })
                .ToListAsync();

            return Results.Ok(new
            {
                Aula = $"{aula.Grado!.Nombre} {aula.Seccion!.Letra}",
                Cursos = cursosAula,
                Competencias = competenciasFiltradas,
                Estudiantes = estudiantes,
                Incidencias = incidencias,
                RendimientoCursos = rendimientoCursos,
                NotasBimestrales = notasBimestrales,
                NotasSemanales = notasSemanales
            });
        }).WithName("GetTutoriaDetallesDocente");
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
