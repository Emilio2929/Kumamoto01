using System.Security.Claims;
using Kumamoto.API.Data;
using Kumamoto.API.DTOs;
using Kumamoto.API.Models;
using Kumamoto.API.Services;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Endpoints;

public static class AuxiliarEndpoints
{
    private const int ROL_DOCENTE = 2;
    private const int ROL_AUXILIAR = 3;

    public static void MapAuxiliarEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auxiliar")
            .WithTags("Auxiliar")
            .RequireAuthorization();

        // GET /api/auxiliar/me/aulas
        group.MapGet("/me/aulas", async (ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            var esAuxiliar = await db.Usuarios.AnyAsync(u => u.Id == userId && u.RolId == ROL_AUXILIAR && u.Estado == 1);
            if (!esAuxiliar) return Results.Forbid();

            var hoy = DateOnly.FromDateTime(DateTime.Today);
            var ahora = TimeOnly.FromDateTime(DateTime.Now);

            var asignaciones = await db.AsignacionesAuxiliar
                .Where(a => a.AuxiliarId == userId && a.Estado == 1)
                .Include(a => a.Aula)!.ThenInclude(x => x!.Grado)
                .Include(a => a.Aula)!.ThenInclude(x => x!.Seccion)
                .OrderBy(a => a.Aula!.Grado!.Nombre)
                .ThenBy(a => a.Aula!.Seccion!.Letra)
                .ToListAsync();

            var aulaIds = asignaciones.Select(a => a.AulaId).Distinct().ToList();
            var estudiantesPorAula = await db.Estudiantes
                .Where(e => e.Estado == 1 && e.AulaId != null && aulaIds.Contains(e.AulaId.Value))
                .GroupBy(e => e.AulaId!.Value)
                .Select(g => new { AulaId = g.Key, EstudianteIds = g.Select(x => x.Id).ToList() })
                .ToListAsync();

            var mapEstudiantes = estudiantesPorAula.ToDictionary(x => x.AulaId, x => x.EstudianteIds);

            var asistenciasHoy = await db.Asistencias
                .Where(a => a.Estado == 1 && a.Fecha == hoy && a.EstudianteId != 0)
                .ToListAsync();

            var diaEs = GetDiaSemanaEs(DateTime.Today.DayOfWeek).ToLower();
            var diaEsSinAcento = diaEs.Replace("é", "e").Replace("á", "a");

            // Obtener horarios de hoy para todas las aulas del auxiliar
            var horariosHoy = await (from hd in db.HorarioDetalle
                                     join ca in db.CargasAcademicas on hd.CargaId equals ca.Id
                                     join c in db.Cursos on ca.CursoId equals c.Id
                                     where aulaIds.Contains(ca.AulaId) 
                                           && ca.Estado == 1 && hd.Estado == 1
                                     select new { ca.AulaId, c.Nombre, hd.HoraInicio, hd.HoraFin, hd.DiaSemana }).ToListAsync();
            
            // Filtrar en memoria para mayor flexibilidad con acentos/case
            var horariosFiltrados = horariosHoy.Where(h => {
                var d = h.DiaSemana.ToLower().Trim();
                return d == diaEs || d == diaEsSinAcento;
            }).ToList();

            var usuariosCache = new Dictionary<int, int>(); // userId -> rolId
            async Task<int?> GetRolIdAsync(int registradoPorId)
            {
                if (usuariosCache.TryGetValue(registradoPorId, out var rolId)) return rolId;
                var r = await db.Usuarios.Where(u => u.Id == registradoPorId).Select(u => (int?)u.RolId).FirstOrDefaultAsync();
                if (r.HasValue) usuariosCache[registradoPorId] = r.Value;
                return r;
            }

            var result = new List<AulaAsignadaAuxiliarDto>();

            foreach (var asig in asignaciones)
            {
                var estudianteIds = mapEstudiantes.TryGetValue(asig.AulaId, out var ids) ? ids : [];
                var asistenciasAula = asistenciasHoy.Where(a => estudianteIds.Contains(a.EstudianteId)).ToList();

                var hActual = horariosFiltrados.FirstOrDefault(h => h.AulaId == asig.AulaId && h.HoraInicio <= ahora && h.HoraFin >= ahora);

                EstadoAsistenciaHoy estado;
                if (asistenciasAula.Count == 0)
                {
                    estado = EstadoAsistenciaHoy.Pendiente;
                }
                else if (asistenciasAula.Any(a => a.RegistradoPorId == userId))
                {
                    estado = EstadoAsistenciaHoy.RegistradaAuxiliar;
                }
                else
                {
                    // Si alguien ya la registró, verificar si fue docente
                    var algunDocente = false;
                    foreach (var a in asistenciasAula)
                    {
                        var rolId = await GetRolIdAsync(a.RegistradoPorId);
                        if (rolId == ROL_DOCENTE) { algunDocente = true; break; }
                    }
                    estado = algunDocente ? EstadoAsistenciaHoy.RegistradaDocente : EstadoAsistenciaHoy.RegistradaAuxiliar;
                }

                result.Add(new AulaAsignadaAuxiliarDto(
                    AsignacionAuxiliarId: asig.Id,
                    AulaId: asig.AulaId,
                    GradoNombre: asig.Aula!.Grado!.Nombre,
                    SeccionLetra: asig.Aula.Seccion!.Letra,
                    AulaDescripcion: asig.Aula.Descripcion,
                    CursoActual: hActual?.Nombre,
                    HorarioClase: hActual != null ? $"{hActual.HoraInicio:hh\\:mm} - {hActual.HoraFin:hh\\:mm}" : null,
                    EnHorario: hActual != null,
                    EstadoAsistenciaHoy: estado.ToString()
                ));
            }

            return Results.Ok(result);
        })
        .WithName("GetAuxiliarMisAulas");

        // GET /api/auxiliar/aulas/{aulaId}/asistencia/hoy
        group.MapGet("/aulas/{aulaId:int}/asistencia/hoy", async (int aulaId, ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            var tieneAsignacion = await db.AsignacionesAuxiliar.AnyAsync(a =>
                a.AuxiliarId == userId && a.AulaId == aulaId && a.Estado == 1);
            if (!tieneAsignacion) return Results.Forbid();

            var hoy = DateOnly.FromDateTime(DateTime.Today);
            var ahora = TimeOnly.FromDateTime(DateTime.Now);
            var diaEs = GetDiaSemanaEs(DateTime.Today.DayOfWeek).ToLower();
            var diaEsSinAcento = diaEs.Replace("é", "e").Replace("á", "a");

            // Verificar si hay una clase programada AHORA
            var horariosAula = await (from hd in db.HorarioDetalle
                                     join ca in db.CargasAcademicas on hd.CargaId equals ca.Id
                                     join c in db.Cursos on ca.CursoId equals c.Id
                                     where ca.AulaId == aulaId 
                                           && ca.Estado == 1 
                                           && hd.Estado == 1
                                     select new { c.Nombre, hd.HoraInicio, hd.HoraFin, CargaId = ca.Id, hd.DiaSemana }).ToListAsync();

            var claseActual = horariosAula.FirstOrDefault(h => {
                var d = h.DiaSemana.ToLower().Trim();
                return (d == diaEs || d == diaEsSinAcento) && h.HoraInicio <= ahora && h.HoraFin >= ahora;
            });

            // Bloqueo si ya registró un docente
            var hayDocente = await (from a in db.Asistencias
                                    join e in db.Estudiantes on a.EstudianteId equals e.Id
                                    join u in db.Usuarios on a.RegistradoPorId equals u.Id
                                    where a.Estado == 1
                                          && a.Fecha == hoy
                                          && e.Estado == 1
                                          && e.AulaId == aulaId
                                          && u.RolId == ROL_DOCENTE
                                    select a.Id).AnyAsync();

            var estudiantes = await db.Estudiantes
                .Where(e => e.Estado == 1 && e.AulaId == aulaId)
                .OrderBy(e => e.Apellidos).ThenBy(e => e.Nombres)
                .ToListAsync();

            var asistencias = await db.Asistencias
                .Where(a => a.Estado == 1 && a.Fecha == hoy && estudiantes.Select(s => s.Id).Contains(a.EstudianteId))
                .ToListAsync();

            var map = asistencias.ToDictionary(a => a.EstudianteId, a => a.Valor);

            var dto = estudiantes.Select(s => new AsistenciaAlumnoHoyDto(
                s.Id,
                s.Nombres,
                s.Apellidos,
                map.TryGetValue(s.Id, out var val) ? val : null
            )).ToList();

            return Results.Ok(new { 
                bloqueadaPorDocente = hayDocente, 
                alumnos = dto,
                fueraDeHorario = claseActual == null,
                cursoActual = claseActual?.Nombre,
                horarioClase = claseActual != null ? $"{claseActual.HoraInicio:hh\\:mm} - {claseActual.HoraFin:hh\\:mm}" : null
            });
        })
        .WithName("GetAsistenciaHoyAuxiliar");

        // POST /api/auxiliar/aulas/{aulaId}/asistencia
        group.MapPost("/aulas/{aulaId:int}/asistencia", async (
            int aulaId,
            GuardarAsistenciaAulaRequest request,
            ClaimsPrincipal user,
            KumamotoDbContext db,
            RiesgoService riesgoService) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            var asignacion = await db.AsignacionesAuxiliar
                .FirstOrDefaultAsync(a => a.AuxiliarId == userId && a.AulaId == aulaId && a.Estado == 1);
            if (asignacion is null) return Results.Forbid();

            var hoy = DateOnly.FromDateTime(DateTime.Today);
            var ahora = TimeOnly.FromDateTime(DateTime.Now);
            var diaEs = GetDiaSemanaEs(DateTime.Today.DayOfWeek).ToLower();
            var diaEsSinAcento = diaEs.Replace("é", "e").Replace("á", "a");

            // REGLA: Debe tomarse dentro del horario
            var horariosAula = await (from hd in db.HorarioDetalle
                                     join ca in db.CargasAcademicas on hd.CargaId equals ca.Id
                                     where ca.AulaId == aulaId 
                                           && ca.Estado == 1 
                                           && hd.Estado == 1
                                     select new { hd.CargaId, ca.AulaId, hd.DiaSemana, hd.HoraInicio, hd.HoraFin }).ToListAsync();

            var claseActual = horariosAula.FirstOrDefault(h => {
                var d = h.DiaSemana.ToLower().Trim();
                return (d == diaEs || d == diaEsSinAcento) && h.HoraInicio <= ahora && h.HoraFin >= ahora;
            });

            if (claseActual == null)
                return Results.BadRequest(new { mensaje = "No puedes registrar asistencia fuera del horario de clase programada." });

            // No permitir suplencia si docente ya registró
            var hayDocente = await (from a in db.Asistencias
                                    join e in db.Estudiantes on a.EstudianteId equals e.Id
                                    join u in db.Usuarios on a.RegistradoPorId equals u.Id
                                    where a.Estado == 1
                                          && a.Fecha == hoy
                                          && e.Estado == 1
                                          && e.AulaId == aulaId
                                          && u.RolId == ROL_DOCENTE
                                    select a.Id).AnyAsync();
            if (hayDocente)
                return Results.Conflict(new { mensaje = "La asistencia ya fue registrada por el docente." });

            var estudiantesAula = await db.Estudiantes
                .Where(e => e.Estado == 1 && e.AulaId == aulaId)
                .ToListAsync();
            
            var setEstIds = estudiantesAula.Select(e => e.Id).ToHashSet();
            var validVals = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "P", "F", "T", "J" };

            // Procesar los items enviados
            var mapRequest = request.Items?.ToDictionary(i => i.EstudianteId, i => i.Valor) ?? new Dictionary<int, string>();

            var existentes = await db.Asistencias
                .Where(a => a.Estado == 1 && a.Fecha == hoy && setEstIds.Contains(a.EstudianteId))
                .ToListAsync();
            var mapExist = existentes.ToDictionary(a => a.EstudianteId);

            foreach (var est in estudiantesAula)
            {
                // REGLA: Si no se marcó, el sistema le tomará como FALTA (F)
                string valor = "F";
                if (mapRequest.TryGetValue(est.Id, out var v) && !string.IsNullOrWhiteSpace(v) && validVals.Contains(v))
                {
                    valor = v.ToUpperInvariant();
                }

                if (mapExist.TryGetValue(est.Id, out var reg))
                {
                    reg.Valor = valor;
                    reg.RegistradoPorId = userId.Value;
                    reg.AsignacionAuxiliarId = asignacion.Id;
                    reg.CargaAcademicaId = claseActual.CargaId; // Vincular a la carga actual
                }
                else
                {
                    db.Asistencias.Add(new Asistencia
                    {
                        EstudianteId = est.Id,
                        RegistradoPorId = userId.Value,
                        AsignacionAuxiliarId = asignacion.Id,
                        CargaAcademicaId = claseActual.CargaId,
                        Fecha = hoy,
                        Valor = valor,
                        Estado = 1
                    });
                }
            }

            await db.SaveChangesAsync();
            await riesgoService.RecalcularVariableDependiente1PorAulaAsync(aulaId, hoy, db);

            return Results.NoContent();
        })
        .WithName("GuardarAsistenciaAuxiliar");
    }

    private static string GetDiaSemanaEs(DayOfWeek day) => day switch
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

    private static int? GetUserId(ClaimsPrincipal user)
    {
        var claim = user.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? user.FindFirstValue("sub");

        if (int.TryParse(claim, out var id)) return id;
        return null;
    }
}

public enum EstadoAsistenciaHoy
{
    Pendiente,
    RegistradaAuxiliar,
    RegistradaDocente
}


