using Kumamoto.API.Data;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Endpoints;

public static class DashboardEndpoints
{
    public static void MapDashboardEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/dashboard").WithTags("Dashboard").RequireAuthorization();

        // GET /api/dashboard/kpis
        group.MapGet("/kpis", async (KumamotoDbContext db) =>
        {
            var hoy = DateOnly.FromDateTime(DateTime.Today);

            // 3 queries secuenciales con GroupBy (antes eran 4 queries separados)
            // DbContext NO es thread-safe: no se puede usar Task.WhenAll aquí
            var totalAlumnos = await db.Estudiantes.CountAsync(e => e.Estado == 1);

            // Asistencia hoy: 1 query con GroupBy en vez de 2 Count separados
            var asist = await db.Asistencias
                .Where(a => a.Fecha == hoy && a.Estado == 1)
                .GroupBy(_ => 1)
                .Select(g => new
                {
                    Total    = g.Count(),
                    Presentes = g.Count(a => a.Valor == "P")
                })
                .OrderBy(_ => 1)
                .FirstOrDefaultAsync();

            // Alertas: 1 query con GroupBy en vez de 2 Count separados
            var alertas = await db.AlertasRiesgo
                .Where(a => a.Estado == 1)
                .GroupBy(_ => 1)
                .Select(g => new
                {
                    Medio = g.Count(a => a.NivelRiesgo == "Medio"),
                    Alto  = g.Count(a => a.NivelRiesgo == "Alto")
                })
                .OrderBy(_ => 1)
                .FirstOrDefaultAsync();

            double porcentajeAsistencia = asist is { Total: > 0 }
                ? Math.Round((double)asist.Presentes / asist.Total * 100, 1)
                : 100.0;

            return Results.Ok(new
            {
                TotalAlumnos  = totalAlumnos,
                AsistenciaHoy = porcentajeAsistencia,
                RiesgoMedio   = alertas?.Medio ?? 0,
                RiesgoAlto    = alertas?.Alto  ?? 0
            });
        })
        .WithName("GetDashboardKpis")
        .WithSummary("Obtiene los KPIs principales del dashboard");

        // GET /api/dashboard/asistencia-global
        group.MapGet("/asistencia-global", async (string? filtro, KumamotoDbContext db) =>
        {
            var hoy = DateOnly.FromDateTime(DateTime.Today);
            DateOnly fechaInicio = hoy;
            DateOnly fechaFin = hoy;

            if (filtro == "week")
            {
                // Inicio de semana (Lunes)
                int diff = (7 + (hoy.DayOfWeek - DayOfWeek.Monday)) % 7;
                fechaInicio = hoy.AddDays(-1 * diff);
            }
            else if (filtro == "month")
            {
                fechaInicio = new DateOnly(hoy.Year, hoy.Month, 1);
                fechaFin = new DateOnly(hoy.Year, hoy.Month, DateTime.DaysInMonth(hoy.Year, hoy.Month));
            }

            // Obtener todos los grados activos
            var grados = await db.Grados
                .Where(g => g.Estado == 1)
                .OrderBy(g => g.Nombre)
                .Select(g => new { g.Id, g.Nombre })
                .ToListAsync();

            // Obtener las asistencias en el rango de fechas con su GradoId
            var asistencias = await db.Asistencias
                .Where(a => a.Fecha >= fechaInicio && a.Fecha <= fechaFin && a.Estado == 1 && a.Estudiante != null && a.Estudiante.Aula != null)
                .Select(a => new
                {
                    GradoId = a.Estudiante!.Aula!.GradoId,
                    a.Valor
                })
                .ToListAsync();

            var resultado = grados.Select(g =>
            {
                var asistGrado = asistencias.Where(a => a.GradoId == g.Id).ToList();
                int total = asistGrado.Count;
                int presentes = asistGrado.Count(a => a.Valor == "P");
                int tardes = asistGrado.Count(a => a.Valor == "T");
                int faltas = asistGrado.Count(a => a.Valor == "F");
                
                double pctPresente = total > 0 ? Math.Round((double)presentes / total * 100, 1) : 0.0;
                double pctTarde = total > 0 ? Math.Round((double)tardes / total * 100, 1) : 0.0;
                double pctFalta = total > 0 ? Math.Round((double)faltas / total * 100, 1) : 0.0;

                // Formatear el nombre corto para la gráfica (ej. "1er Grado" -> "1ro", "2do Grado" -> "2do")
                string label = g.Nombre;
                if (label.StartsWith("1")) label = "1ro";
                else if (label.StartsWith("2")) label = "2do";
                else if (label.StartsWith("3")) label = "3ro";
                else if (label.StartsWith("4")) label = "4to";
                else if (label.StartsWith("5")) label = "5to";

                return new
                {
                    Grado = g.Nombre,
                    Label = label,
                    PorcentajePresente = pctPresente,
                    PorcentajeTarde = pctTarde,
                    PorcentajeFalta = pctFalta,
                    TotalRegistros = total
                };
            }).ToList();

            return Results.Ok(resultado);
        })
        .WithName("GetAsistenciaGlobal")
        .WithSummary("Obtiene el porcentaje de asistencia por grado según filtro (today, week, month)");

        // GET /api/dashboard/risk-monitor-ai
        group.MapGet("/risk-monitor-ai", async (KumamotoDbContext db) =>
        {
            // Extraer estudiantes con sus asistencias y notas literales
            var estudiantes = await db.Estudiantes
                .Where(e => e.Estado == 1)
                .Select(e => new
                {
                    e.Id,
                    AsistenciasTotal = db.Asistencias.Count(a => a.EstudianteId == e.Id && a.Estado == 1),
                    AsistenciasPresente = db.Asistencias.Count(a => a.EstudianteId == e.Id && a.Valor == "P" && a.Estado == 1),
                    PromedioNotas = db.Calificaciones
                        .Where(c => c.EstudianteId == e.Id && c.Estado == 1 && c.Escala != null)
                        .Select(c => c.Escala!.Letra)
                        .ToList()
                })
                .ToListAsync();

            int riesgoAlto = 0;
            int riesgoMedio = 0;

            foreach (var est in estudiantes)
            {
                // 1. Feature Extraction: Porcentaje de Asistencia
                double asisPerc = est.AsistenciasTotal > 0 
                    ? (double)est.AsistenciasPresente / est.AsistenciasTotal * 100 
                    : 100.0;

                // 2. Feature Extraction: Conversión de Escala Minedu a Valor Numérico para el modelo
                double sumNotas = 0;
                int countNotas = est.PromedioNotas.Count;
                foreach (var nota in est.PromedioNotas)
                {
                    if (nota == "AD") sumNotas += 20;
                    else if (nota == "A") sumNotas += 16;
                    else if (nota == "B") sumNotas += 12;
                    else if (nota == "C") sumNotas += 8;
                }
                
                double avgNota = countNotas > 0 ? sumNotas / countNotas : 16.0; // Promedio seguro si no hay notas

                // 3. AI Predictive Model (Weighted Scoring Heuristic)
                // Pesos dinámicos: Asistencia impacta 40%, Rendimiento Académico impacta 60%
                double gradeScore = (avgNota / 20.0) * 100.0;
                double riskScore = (asisPerc * 0.4) + (gradeScore * 0.6);

                // 4. Clasificación de Riesgo basada en Umbrales Estadísticos
                if (riskScore < 60.0 || asisPerc < 70.0 || avgNota < 10.5) 
                {
                    // Riesgo Alto: Si el score global es muy bajo, la asistencia es crítica (<70%), o el promedio está en rojo (<10.5)
                    riesgoAlto++;
                }
                else if (riskScore < 75.0 || asisPerc < 85.0 || avgNota < 13.0) 
                {
                    // Riesgo Medio: Si el score global es moderado, hay ausentismo recurrente, o notas regulares
                    riesgoMedio++;
                }
            }

            return Results.Ok(new
            {
                TotalAlertas = riesgoAlto + riesgoMedio,
                RiesgoAlto = riesgoAlto,
                RiesgoMedio = riesgoMedio
            });
        })
        .WithName("GetRiskMonitorAI")
        .WithSummary("Calcula proyecciones de riesgo usando un modelo heurístico (IA) basado en notas y asistencias");

        // GET /api/dashboard/risk-monitor-ai/details
        group.MapGet("/risk-monitor-ai/details", async (KumamotoDbContext db) =>
        {
            var estudiantesInfo = await db.Estudiantes
                .Where(e => e.Estado == 1)
                .Select(e => new
                {
                    e.Id,
                    e.Dni,
                    e.Nombres,
                    e.Apellidos,
                    Grado = e.Aula != null && e.Aula.Grado != null ? e.Aula.Grado.Nombre : "Sin asignar",
                    Seccion = e.Aula != null && e.Aula.Seccion != null ? e.Aula.Seccion.Letra.ToString() : "Sin asignar",
                    Tutor = e.Aula != null && e.Aula.Tutor != null ? e.Aula.Tutor.Nombres + " " + e.Aula.Tutor.Apellidos : "Sin asignar",
                    AsistenciasTotal = db.Asistencias.Count(a => a.EstudianteId == e.Id && a.Estado == 1),
                    AsistenciasPresente = db.Asistencias.Count(a => a.EstudianteId == e.Id && a.Valor == "P" && a.Estado == 1),
                    PromedioNotas = db.Calificaciones
                        .Where(c => c.EstudianteId == e.Id && c.Estado == 1 && c.Escala != null)
                        .Select(c => c.Escala!.Letra)
                        .ToList(),
                    CalificacionesInfo = db.Calificaciones
                        .Where(c => c.EstudianteId == e.Id && c.Estado == 1 && c.Escala != null)
                        .Select(c => new { 
                            Letra = c.Escala!.Letra, 
                            Curso = c.Competencia != null && c.Competencia.Curso != null ? c.Competencia.Curso.Nombre : "Curso General", 
                            Competencia = c.Competencia != null ? c.Competencia.Nombre : "Evaluación General" 
                        })
                        .ToList()
                })
                .ToListAsync();

            var enRiesgo = new List<object>();

            foreach (var est in estudiantesInfo)
            {
                double asisPerc = est.AsistenciasTotal > 0 
                    ? (double)est.AsistenciasPresente / est.AsistenciasTotal * 100 
                    : 100.0;

                double sumNotas = 0;
                int countNotas = est.PromedioNotas.Count;
                foreach (var nota in est.PromedioNotas)
                {
                    if (nota == "AD") sumNotas += 20;
                    else if (nota == "A") sumNotas += 16;
                    else if (nota == "B") sumNotas += 12;
                    else if (nota == "C") sumNotas += 8;
                }
                
                double avgNota = countNotas > 0 ? sumNotas / countNotas : 16.0;

                double gradeScore = (avgNota / 20.0) * 100.0;
                double riskScore = (asisPerc * 0.4) + (gradeScore * 0.6);

                string nivelRiesgo = "Bajo";
                string motivo = "";

                if (riskScore < 60.0 || asisPerc < 70.0 || avgNota < 10.5) 
                {
                    nivelRiesgo = "Alto";
                    motivo = $"Asistencia: {Math.Round(asisPerc,1)}% | Nota Proyectada: {Math.Round(avgNota,1)}/20";
                }
                else if (riskScore < 75.0 || asisPerc < 85.0 || avgNota < 13.0) 
                {
                    nivelRiesgo = "Medio";
                    motivo = $"Asistencia: {Math.Round(asisPerc,1)}% | Nota Proyectada: {Math.Round(avgNota,1)}/20";
                }

                if (nivelRiesgo != "Bajo")
                {
                    var cursosProblematicos = est.CalificacionesInfo
                        .Where(c => c.Letra == "B" || c.Letra == "C")
                        .GroupBy(c => c.Curso)
                        .Select(g => $"{g.Key}: {string.Join(", ", g.Select(x => x.Competencia).Distinct())}")
                        .ToList();

                    if (cursosProblematicos.Any())
                    {
                        motivo += "\n\nCursos y Competencias Críticas:\n- " + string.Join("\n- ", cursosProblematicos);
                    }

                    enRiesgo.Add(new
                    {
                        Id = est.Id,
                        Dni = est.Dni,
                        Estudiante = $"{est.Apellidos}, {est.Nombres}",
                        Grado = est.Grado,
                        Seccion = est.Seccion,
                        Tutor = est.Tutor,
                        NivelRiesgo = nivelRiesgo,
                        Motivo = motivo
                    });
                }
            }

            return Results.Ok(enRiesgo.OrderBy(r => ((dynamic)r).NivelRiesgo == "Alto" ? 0 : 1).ThenBy(r => ((dynamic)r).Grado));
        })
        .WithName("GetRiskMonitorAIDetails")
        .WithSummary("Devuelve el detalle de los estudiantes en riesgo detectados por la IA");

        // POST /api/dashboard/risk-monitor-ai/notify/{id}
        group.MapPost("/risk-monitor-ai/notify/{id:int}", async (int id, NotifyRiskDto dto, KumamotoDbContext db) =>
        {
            var estudiante = await db.Estudiantes.FindAsync(id);
            if (estudiante == null)
                return Results.NotFound(new { mensaje = "Estudiante no encontrado." });

            if (estudiante.PadreId == null)
                return Results.BadRequest(new { mensaje = "El estudiante no tiene un padre asignado en el sistema." });

            var comunicado = new Kumamoto.API.Models.Comunicado
            {
                Titulo = $"🚨 Alerta Académica (IA) - Nivel {dto.NivelRiesgo}: {estudiante.Nombres} {estudiante.Apellidos}",
                Contenido = $"Estimado padre de familia, nuestro sistema de Inteligencia Artificial ha detectado un posible riesgo académico para su menor hijo(a).\n\nDetalles del Análisis:\n{dto.Motivo}\n\nPor favor, comuníquese con el tutor del aula lo antes posible para coordinar apoyo.",
                EsImportante = true,
                UsuarioId = estudiante.PadreId
            };
            db.Comunicados.Add(comunicado);

            // También actualizamos el panel del Padre insertando en AlumnoRiesgo
            var alumnoRiesgo = new Kumamoto.API.Models.AlumnoRiesgo
            {
                EstudianteId = estudiante.Id,
                NivelRiesgo = dto.NivelRiesgo,
                Motivo = dto.Motivo,
                Recomendacion = "Por favor comuníquese con el tutor del aula.",
                FechaCalculo = DateTime.UtcNow,
                Estado = 1
            };
            db.AlumnosRiesgo.Add(alumnoRiesgo);

            await db.SaveChangesAsync();

            return Results.Ok(new { mensaje = "Notificación enviada al padre exitosamente." });
        })
        .WithName("NotifyRiskParent")
        .WithSummary("Envía una alerta (comunicado) al padre del estudiante");

        // GET /api/dashboard/libreta/{id}
        group.MapGet("/libreta/{id:int}", async (int id, KumamotoDbContext db) =>
        {
            var estudiante = await db.Estudiantes
                .Include(e => e.Aula).ThenInclude(a => a!.Grado)
                .Include(e => e.Aula).ThenInclude(a => a!.Seccion)
                .FirstOrDefaultAsync(e => e.Id == id && e.Estado == 1);

            if (estudiante == null) return Results.NotFound();

            // 1. Obtener todos los cursos (cargas) del aula del estudiante
            var cargas = await db.CargasAcademicas
                .Include(ca => ca.Curso)
                .Where(ca => ca.AulaId == estudiante.AulaId && ca.Estado == 1)
                .ToListAsync();

            // 2. Obtener todas las calificaciones del estudiante
            var calificaciones = await db.Calificaciones
                .Include(c => c.Competencia).ThenInclude(comp => comp!.Curso)
                .Include(c => c.Semana).ThenInclude(s => s!.Periodo)
                .Include(c => c.Escala)
                .Where(c => c.EstudianteId == estudiante.Id && c.Estado == 1)
                .ToListAsync();

            // 3. Obtener todas las asistencias del estudiante
            var asistencias = await db.Asistencias
                .Include(a => a.CargaAcademica).ThenInclude(ca => ca!.Curso)
                .Where(a => a.EstudianteId == estudiante.Id && a.Estado == 1)
                .ToListAsync();

            // Agrupar calificaciones por Bimestre / Periodo
            var periodos = calificaciones
                .Where(c => c.Semana?.Periodo != null)
                .Select(c => c.Semana!.Periodo!.Nombre)
                .Distinct()
                .ToList();

            if (!periodos.Any()) periodos.Add("Periodo General");

            var historial = new List<object>();

            foreach (var periodo in periodos)
            {
                var cursosBimestre = new List<object>();

                // Iterar sobre los cursos del aula (o cursos con notas si no hay cargas)
                var nombresCursos = cargas.Select(ca => ca.Curso?.Nombre ?? "Curso General").Distinct().ToList();
                var cursosConNotas = calificaciones.Select(c => c.Competencia?.Curso?.Nombre ?? "Curso General").Distinct();
                var todosLosCursos = nombresCursos.Union(cursosConNotas).Distinct().ToList();

                foreach (var nombreCurso in todosLosCursos)
                {
                    // Calificaciones de este curso en este periodo
                    var califCurso = calificaciones
                        .Where(c => (c.Semana?.Periodo?.Nombre ?? "Periodo General") == periodo &&
                                    (c.Competencia?.Curso?.Nombre ?? "Curso General") == nombreCurso &&
                                    c.Escala != null)
                        .ToList();

                    // Agrupar por Semana (NumeroSemana)
                    var semanasCurso = califCurso
                        .GroupBy(c => c.Semana != null ? $"Semana {c.Semana.NumeroSemana}" : "Semana General")
                        .OrderBy(g => g.Key)
                        .Select(gSemana => new {
                            semana = gSemana.Key,
                            evaluaciones = gSemana.Select(c => new {
                                competencia = c.Competencia?.Nombre ?? "Evaluación General",
                                nota = c.Escala?.Letra ?? "-"
                            }).ToList()
                        })
                        .ToList();

                    // Asistencias de este curso (general o por carga)
                    var asistCurso = asistencias
                        .Where(a => (a.CargaAcademica?.Curso?.Nombre ?? "Curso General") == nombreCurso || a.CargaAcademicaId == null)
                        .ToList();

                    int totalAsist = asistCurso.Count;
                    int presentes = asistCurso.Count(a => a.Valor == "P");
                    int faltas = asistCurso.Count(a => a.Valor == "F");
                    double pctAsist = totalAsist > 0 ? Math.Round((double)presentes / totalAsist * 100, 1) : 100.0;

                    cursosBimestre.Add(new {
                        curso = nombreCurso,
                        asistencia = new {
                            porcentaje = pctAsist,
                            total = totalAsist,
                            presentes = presentes,
                            faltas = faltas
                        },
                        semanas = semanasCurso
                    });
                }

                historial.Add(new {
                    bimestre = periodo,
                    cursos = cursosBimestre
                });
            }

            return Results.Ok(new 
            {
                estudiante = $"{estudiante.Nombres} {estudiante.Apellidos}",
                grado = estudiante.Aula != null ? $"{estudiante.Aula.Grado!.Nombre} - Sección {estudiante.Aula.Seccion!.Letra}" : "",
                historial = historial
            });
        })
        .WithName("GetLibretaEstudianteDirectora")
        .WithSummary("Obtiene el historial detallado de notas, competencias y asistencia por curso de un estudiante (Solo Directora)");
    }
}

public class NotifyRiskDto 
{
    public string Motivo { get; set; } = string.Empty;
    public string NivelRiesgo { get; set; } = string.Empty;
}
