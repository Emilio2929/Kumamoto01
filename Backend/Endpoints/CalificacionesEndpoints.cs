using Kumamoto.API.Data;
using Kumamoto.API.DTOs;
using Kumamoto.API.Models;
using Kumamoto.API.Services;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Kumamoto.API.Endpoints;

public static class CalificacionesEndpoints
{
    public static void MapCalificacionesEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/calificaciones").WithTags("Calificaciones").RequireAuthorization();

        // ── POST /api/calificaciones/competencias
        group.MapPost("/competencias", async (CrearCompetenciaRequest request, ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            // Validar que la carga pertenezca al docente
            var carga = await db.CargasAcademicas.FirstOrDefaultAsync(c => c.Id == request.CargaId && c.Estado == 1);
            if (carga == null) return Results.NotFound("Carga académica no encontrada.");
            if (carga.DocenteId != userId) return Results.Forbid();

            // Siguiente numero_orden (si existiera lógica) o simplemente agregar
            var maxOrden = await db.Competencias
                .Where(c => c.CargaId == request.CargaId && c.Estado == 1)
                .MaxAsync(c => (int?)c.NumeroOrden) ?? 0;

            var comp = new Competencia
            {
                CargaId = request.CargaId,
                Codigo = request.Codigo,
                Nombre = request.Nombre,
                NumeroOrden = maxOrden + 1,
                Estado = 1
            };

            db.Competencias.Add(comp);
            await db.SaveChangesAsync();

            return Results.Ok(new CompetenciaDto(comp.Id, comp.Codigo, comp.Nombre));
        }).WithName("CrearCompetencia");

        // ── GET /api/calificaciones/competencias/carga/{cargaId}
        group.MapGet("/competencias/carga/{cargaId}", async (int cargaId, ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            var carga = await db.CargasAcademicas.FirstOrDefaultAsync(c => c.Id == cargaId && c.Estado == 1);
            if (carga == null) return Results.NotFound();
            if (carga.DocenteId != userId) return Results.Forbid();

            var comps = await db.Competencias
                .Where(c => c.CargaId == cargaId && c.Estado == 1)
                .OrderBy(c => c.NumeroOrden)
                .Select(c => new CompetenciaDto(c.Id, c.Codigo, c.Nombre))
                .ToListAsync();

            return Results.Ok(comps);
        }).WithName("GetCompetenciasPorCarga");

        // ── GET /api/calificaciones/mis-cursos
        group.MapGet("/mis-cursos", async (ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            var cargas = await db.CargasAcademicas
                .Include(c => c.Curso)
                .Include(c => c.Aula).ThenInclude(a => a!.Grado)
                .Include(c => c.Aula).ThenInclude(a => a!.Seccion)
                .Where(c => c.DocenteId == userId && c.Estado == 1)
                .Select(c => new
                {
                    cargaId = c.Id,
                    curso = c.Curso!.Nombre,
                    grado = c.Aula!.Grado!.Nombre,
                    seccion = c.Aula!.Seccion!.Letra
                })
                .ToListAsync();

            return Results.Ok(cargas);
        }).WithName("GetMisCursos");

        // ── DELETE /api/calificaciones/competencias/{id}
        group.MapDelete("/competencias/{id}", async (int id, ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            var comp = await db.Competencias.Include(c => c.Carga).FirstOrDefaultAsync(c => c.Id == id && c.Estado == 1);
            if (comp == null) return Results.NotFound();
            if (comp.Carga?.DocenteId != userId) return Results.Forbid();

            // Opcional: verificar si tiene calificaciones, pero por ahora borrado lógico
            comp.Estado = 0;
            await db.SaveChangesAsync();

            return Results.Ok();
        }).WithName("DeleteCompetencia");

        // ── GET /api/calificaciones/planilla
        group.MapGet("/planilla", async (int cargaId, int semanaId, string competenciasIds, ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            var carga = await db.CargasAcademicas.Include(c => c.Aula).FirstOrDefaultAsync(c => c.Id == cargaId && c.Estado == 1);
            if (carga == null) return Results.NotFound();
            if (carga.DocenteId != userId) return Results.Forbid();

            // Filtrar las competencias seleccionadas para la semana
            var selectedIds = competenciasIds.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(int.Parse).ToList();

            var comps = await db.Competencias
                .Where(c => c.CargaId == cargaId && c.Estado == 1 && selectedIds.Contains(c.Id))
                .OrderBy(c => c.NumeroOrden)
                .ToListAsync();

            var estudiantes = await db.Estudiantes
                .Where(e => e.AulaId == carga.AulaId && e.Estado == 1)
                .OrderBy(e => e.Apellidos).ThenBy(e => e.Nombres)
                .ToListAsync();

            // En 5NF, la calificación se busca por semana_id y la competencia (que implícitamente pertenece a la carga)
            var calificaciones = await db.Calificaciones
                .Include(c => c.Escala)
                .Where(c => c.SemanaId == semanaId && selectedIds.Contains(c.CompetenciaId ?? 0) && c.Estado == 1)
                .ToListAsync();

            // Alertas (para mostrar el badge de riesgo en la UI)
            var alertas = await db.AlertasRiesgo
                .Where(a => a.Estado == 1)
                .Select(a => a.EstudianteId)
                .Distinct()
                .ToListAsync();

            var ahora = DateTime.UtcNow;

            var desbloqueos = await db.DesbloqueosCalificacion
                .Where(d => d.CargaId == cargaId && d.SemanaId == semanaId && d.Estado == 1 && d.FechaExpiracion > ahora)
                .Select(d => d.EstudianteId)
                .Distinct()
                .ToListAsync();

            var compDtos = comps.Select(c => new CompetenciaDto(c.Id, c.Codigo, c.Nombre)).ToList();
            var alumnos = new List<AlumnoPlanillaDto>();


            foreach (var est in estudiantes)
            {
                var dictNotas = new Dictionary<string, NotaCeldaDto>();
                foreach (var c in comps)
                {
                    var cal = calificaciones.FirstOrDefault(cal => cal.EstudianteId == est.Id && cal.CompetenciaId == c.Id);
                    bool bloqueado = false;
                    if (cal != null)
                    {
                        bloqueado = (ahora - cal.FechaRegistro).TotalHours > 24;
                        if (bloqueado && desbloqueos.Contains(est.Id))
                        {
                            bloqueado = false;
                        }
                    }
                    dictNotas[c.Id.ToString()] = new NotaCeldaDto(cal?.Escala?.Letra, bloqueado);
                }

                alumnos.Add(new AlumnoPlanillaDto(
                    est.Id,
                    $"{est.Apellidos}, {est.Nombres}",
                    alertas.Contains(est.Id),
                    dictNotas
                ));
            }

            return Results.Ok(new PlanillaResponse(compDtos, alumnos));
        }).WithName("GetPlanilla");

        // ── POST /api/calificaciones/bulk-save
        group.MapPost("/bulk-save", async (BulkSaveNotasRequest request, ClaimsPrincipal user, KumamotoDbContext db, AlertaTempranaService alertaTempranaService) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            if (request.SemanaId <= 0) 
                return Results.BadRequest(new { mensaje = "ID de semana inválido." });

            var carga = await db.CargasAcademicas.FirstOrDefaultAsync(c => c.Id == request.CargaId && c.Estado == 1);
            if (carga == null) return Results.NotFound(new { mensaje = "Carga académica no encontrada." });
            if (carga.DocenteId != userId) return Results.Forbid();

            var procesados = new HashSet<int>();
            var ahora = DateTime.UtcNow;

            // Validar que la semana pertenezca al calendario activo
            var semanaObj = await db.SemanaAcademicas.FirstOrDefaultAsync(s => s.Id == request.SemanaId && s.Estado == 1);
            if (semanaObj == null) 
                return Results.BadRequest(new { mensaje = "La semana seleccionada no existe o no está activa." });

            var escalas = await db.EscalaCalificaciones.Where(e => e.Estado == 1).ToListAsync();
            var escalaDict = escalas.ToDictionary(e => e.Letra.ToUpper(), e => e.Id);

            var desbloqueosActivos = await db.DesbloqueosCalificacion
                .Where(d => d.CargaId == request.CargaId && 
                            d.SemanaId == request.SemanaId && 
                            d.Estado == 1 &&
                            d.FechaExpiracion > ahora)
                .ToListAsync();

            foreach (var item in request.Notas)
            {
                var letra = item.Nota?.ToUpper() ?? "";
                if (!escalaDict.TryGetValue(letra, out var escalaId)) continue;

                var existente = await db.Calificaciones
                    .FirstOrDefaultAsync(c => c.EstudianteId == item.EstudianteId 
                                           && c.CompetenciaId == item.CompetenciaId 
                                           && c.SemanaId == request.SemanaId 
                                           && c.Estado == 1);
                
                if (existente != null)
                {
                    // Regla de las 24 horas
                    if ((ahora - existente.FechaRegistro).TotalHours > 24)
                    {
                        // Verificar desbloqueo
                        var desbloqueo = desbloqueosActivos.FirstOrDefault(d => d.EstudianteId == item.EstudianteId);
                        if (desbloqueo == null)
                        {
                            continue;
                        }
                        
                        // Hacer que sea de un solo uso
                        desbloqueo.Estado = 0;
                    }
                    existente.EscalaId = escalaId;
                }
                else
                {
                    db.Calificaciones.Add(new Calificacion
                    {
                        EstudianteId = item.EstudianteId,
                        CompetenciaId = item.CompetenciaId,
                        SemanaId = request.SemanaId,
                        EscalaId = escalaId,
                        Estado = 1,
                        FechaRegistro = ahora
                    });
                }
                procesados.Add(item.EstudianteId);
            }

            try 
            {
                await db.SaveChangesAsync();

                // Recalcular riesgo (Cerebro Alerta Temprana)
                foreach (var estudianteId in procesados)
                {
                    await alertaTempranaService.RecalcularRiesgoAcademico(estudianteId);
                }

                return Results.Ok(new { mensaje = "Notas guardadas correctamente." });
            }
            catch (Exception ex)
            {
                var innerMsg = ex.InnerException?.InnerException?.Message 
                            ?? ex.InnerException?.Message 
                            ?? ex.Message;
                return Results.Json(new { mensaje = "Error al guardar.", detalle = innerMsg }, statusCode: 500);
            }
        }).WithName("BulkSaveNotas");

        // ── GET /api/calificaciones/config (Bimestres y Semanas)
        group.MapGet("/config", async (KumamotoDbContext db) =>
        {
            // Traemos los periodos como entidades para evitar problemas de tipo DateOnly en proyecciones anónimas
            var periodosDb = await db.PeriodosAcademicos
                .Where(p => p.Estado == 1)
                .OrderBy(p => p.Numero)
                .ToListAsync();

            var semanasDb = await db.SemanaAcademicas
                .Where(s => s.Estado == 1)
                .OrderBy(s => s.NumeroSemana)
                .ToListAsync();

            var periodos = periodosDb.Select(p => new
            {
                id = p.Id,
                nombre = p.Nombre,
                fechaInicio = p.FechaInicio.ToString("yyyy-MM-dd"),
                fechaFin = p.FechaFin.ToString("yyyy-MM-dd"),
                estaCerrado = p.EstaCerrado,
                semanas = semanasDb
                    .Where(s => s.PeriodoId == p.Id)
                    .Select(s => new { id = s.Id, numeroSemana = s.NumeroSemana })
                    .ToList()
            }).ToList();

            var escalas = await db.EscalaCalificaciones
                .Where(e => e.Estado == 1)
                .Select(e => new { e.Id, e.Letra, e.Descripcion, e.RequiereIntervencion })
                .ToListAsync();

            return Results.Ok(new { periodos, escalas });
        }).WithName("GetCalificacionesConfig");

        // ── GET /api/calificaciones/reporte/{cargaId} (Promedios Bimestrales)
        group.MapGet("/reporte/{cargaId}", async (int cargaId, int periodoId, ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            var carga = await db.CargasAcademicas.Include(c => c.Aula).FirstOrDefaultAsync(c => c.Id == cargaId && c.Estado == 1);
            if (carga == null || carga.DocenteId != userId) return Results.Forbid();

            var comps = await db.Competencias
                .Where(c => c.CargaId == cargaId && c.Estado == 1)
                .OrderBy(c => c.NumeroOrden)
                .ToListAsync();

            var estudiantes = await db.Estudiantes
                .Where(e => e.AulaId == carga.AulaId && e.Estado == 1)
                .OrderBy(e => e.Apellidos).ThenBy(e => e.Nombres)
                .ToListAsync();

            // Obtenemos las semanas del periodo
            var semanasPeriodo = await db.SemanaAcademicas
                .Where(s => s.PeriodoId == periodoId && s.Estado == 1)
                .Select(s => s.Id)
                .ToListAsync();

            // Obtenemos todas las notas de este aula para esas semanas
            var notasPeriodo = await db.Calificaciones
                .Include(c => c.Escala)
                .Where(c => semanasPeriodo.Contains(c.SemanaId) && c.Estado == 1)
                .ToListAsync();

            var semanasOrdenadas = await db.SemanaAcademicas
                .Where(s => s.PeriodoId == periodoId && s.Estado == 1)
                .OrderBy(s => s.NumeroSemana)
                .ToListAsync();

            var alumnosReporte = new List<object>();

            foreach (var est in estudiantes)
            {
                var promediosComp = new Dictionary<string, string>();
                var detallesSemanales = new Dictionary<string, List<object>>();
                double sumaBimestre = 0;
                int countBimestre = 0;

                foreach (var c in comps)
                {
                    var notasEstComp = notasPeriodo
                        .Where(n => n.EstudianteId == est.Id && n.CompetenciaId == c.Id && n.Escala != null)
                        .ToList();

                    var listaSemanasComp = new List<object>();
                    foreach (var s in semanasOrdenadas)
                    {
                        var notaSemana = notasEstComp.FirstOrDefault(n => n.SemanaId == s.Id);
                        listaSemanasComp.Add(new { 
                            semanaId = s.Id, 
                            numeroSemana = s.NumeroSemana, 
                            nota = notaSemana?.Escala?.Letra ?? "-" 
                        });
                    }
                    detallesSemanales[c.Id.ToString()] = listaSemanasComp;

                    if (notasEstComp.Any())
                    {
                        double sum = 0;
                        foreach (var n in notasEstComp)
                        {
                            sum += LetraToNum(n.Escala!.Letra);
                        }
                        double avg = sum / notasEstComp.Count;
                        string letraAvg = NumToLetra(avg);
                        
                        promediosComp[c.Id.ToString()] = letraAvg;

                        sumaBimestre += avg;
                        countBimestre++;
                    }
                    else
                    {
                        promediosComp[c.Id.ToString()] = "-";
                    }
                }

                string promedioFinalBimestre = "-";
                if (countBimestre > 0)
                {
                    double avgBimestre = sumaBimestre / countBimestre;
                    promedioFinalBimestre = NumToLetra(avgBimestre);
                }

                alumnosReporte.Add(new
                {
                    estudianteId = est.Id,
                    nombreCompleto = $"{est.Apellidos}, {est.Nombres}",
                    promediosCompetencias = promediosComp,
                    promedioBimestre = promedioFinalBimestre,
                    detallesSemanales = detallesSemanales
                });
            }

            return Results.Ok(new
            {
                competencias = comps.Select(c => new { c.Id, c.Codigo, c.Nombre }).ToList(),
                semanas = semanasOrdenadas.Select(s => new { s.Id, s.NumeroSemana }).ToList(),
                alumnos = alumnosReporte
            });
        }).WithName("GetReporteBimestral");
    }

    private static double LetraToNum(string letra)
    {
        return letra.ToUpper() switch
        {
            "AD" => 4.0,
            "A" => 3.0,
            "B" => 2.0,
            "C" => 1.0,
            _ => 0.0
        };
    }

    private static string NumToLetra(double num)
    {
        if (num >= 3.5) return "AD";
        if (num >= 2.5) return "A";
        if (num >= 1.5) return "B";
        if (num > 0) return "C";
        return "-";
    }

    private static int? GetUserId(ClaimsPrincipal user)
    {
        var claim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value;
        if (int.TryParse(claim, out var id)) return id;
        return null;
    }
}
