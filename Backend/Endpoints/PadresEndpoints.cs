using Kumamoto.API.Data;
using Kumamoto.API.DTOs;
using Kumamoto.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Endpoints;

public static class PadresEndpoints
{
    private const int ROL_PADRE = 4;

    public static void MapPadresEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/padres").WithTags("Padres").RequireAuthorization();

        // ── GET /api/padres  → todos los padres registrados
        group.MapGet("/", async (KumamotoDbContext db) =>
        {
            var padres = await db.Usuarios
                .Where(u => u.RolId == ROL_PADRE)
                .OrderBy(u => u.Apellidos).ThenBy(u => u.Nombres)
                .Select(u => new PadreDetalleDto(
                    u.Id, u.Dni, u.Nombres, u.Apellidos, u.Correo, u.CorreoPersonal, u.Telefono, u.Estado
                ))
                .ToListAsync();
            return Results.Ok(padres);
        }).WithName("GetPadres");

        // ── GET /api/padres/buscar?dni=X  → buscar padre por DNI
        group.MapGet("/buscar", async (string? dni, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dni) || dni.Length < 4)
                return Results.BadRequest(new { mensaje = "Ingrese al menos 4 dígitos del DNI." });

            var padre = await db.Usuarios
                .Where(u => u.RolId == ROL_PADRE && u.Dni.Contains(dni.Trim()))
                .Select(u => new PadreDetalleDto(
                    u.Id, u.Dni, u.Nombres, u.Apellidos, u.Correo, u.CorreoPersonal, u.Telefono, u.Estado
                ))
                .FirstOrDefaultAsync();

            return padre is null
                ? Results.NotFound(new { mensaje = "No se encontró ningún padre con ese DNI." })
                : Results.Ok(padre);
        }).WithName("BuscarPadrePorDni");

        // ── POST /api/padres  → crear padre con credenciales auto-generadas
        group.MapPost("/", async (CreatePadreDto dto, KumamotoDbContext db) =>
        {
            var correoInstitucional = $"p{dto.Dni}@kumamoto.edu.pe";
            var correoPersonal = string.IsNullOrWhiteSpace(dto.Correo) ? null : dto.Correo.Trim().ToLower();

            var existeDni = await db.Usuarios.AnyAsync(u => u.Dni == dto.Dni);
            if (existeDni)
                return Results.Conflict(new { mensaje = "Ya existe un usuario con ese DNI." });

            var existeCorreoInst = await db.Usuarios.AnyAsync(u => u.Correo == correoInstitucional);
            if (existeCorreoInst)
                return Results.Conflict(new { mensaje = "El correo institucional para este DNI ya está registrado." });

            if (!string.IsNullOrWhiteSpace(correoPersonal))
            {
                var existeCorreoPers = await db.Usuarios.AnyAsync(u => u.CorreoPersonal == correoPersonal);
                if (existeCorreoPers)
                    return Results.Conflict(new { mensaje = "Ese correo personal ya está registrado." });
            }

            var clave = $"Kuma{dto.Dni}";

            var padre = new Usuario
            {
                Dni = dto.Dni.Trim(),
                Nombres = dto.Nombres.Trim(),
                Apellidos = dto.Apellidos.Trim(),
                Correo = correoInstitucional,
                CorreoPersonal = correoPersonal,
                Telefono = dto.Telefono?.Trim(),
                ClaveHash = clave,
                RolId = ROL_PADRE,
                Estado = 1
            };
            db.Usuarios.Add(padre);
            await db.SaveChangesAsync();

            var msg = string.IsNullOrWhiteSpace(correoPersonal)
                ? $"Padre registrado con correo institucional: {correoInstitucional}. Clave: {clave}"
                : $"Padre registrado. Credenciales enviadas a {correoPersonal}. Clave: {clave}";

            return Results.Created($"/api/padres/{padre.Id}", new
            {
                padre.Id,
                correo = padre.Correo,
                claveGenerada = clave,
                mensaje = msg
            });
        }).WithName("CreatePadre");

        // ── PUT /api/padres/{id}  → editar datos del padre
        group.MapPut("/{id:int}", async (int id, UpdatePadreDto dto, KumamotoDbContext db) =>
        {
            var padre = await db.Usuarios.FindAsync(id);
            if (padre is null || padre.RolId != ROL_PADRE) return Results.NotFound();

            if (string.IsNullOrWhiteSpace(dto.Nombres))
                return Results.BadRequest(new { mensaje = "El nombre es requerido." });

            if (!string.IsNullOrWhiteSpace(dto.Correo))
            {
                var correoPers = dto.Correo.Trim().ToLower();
                var duplicado = await db.Usuarios.AnyAsync(u => u.CorreoPersonal == correoPers && u.Id != id);
                if (duplicado)
                    return Results.Conflict(new { mensaje = "Ese correo personal ya está en uso." });
            }

            padre.Nombres = dto.Nombres.Trim();
            padre.Apellidos = dto.Apellidos?.Trim() ?? padre.Apellidos;
            padre.CorreoPersonal = string.IsNullOrWhiteSpace(dto.Correo) ? null : dto.Correo.Trim().ToLower();
            padre.Telefono = dto.Telefono?.Trim();
            await db.SaveChangesAsync();

            return Results.NoContent();
        }).WithName("UpdatePadre");

        // ── PATCH /api/padres/{id}/clave  → cambiar contraseña
        group.MapPatch("/{id:int}/clave", async (int id, CambiarClaveDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.NuevaClave) || dto.NuevaClave.Length < 4)
                return Results.BadRequest(new { mensaje = "La contraseña debe tener al menos 4 caracteres." });

            var padre = await db.Usuarios.FindAsync(id);
            if (padre is null || padre.RolId != ROL_PADRE) return Results.NotFound();

            padre.ClaveHash = dto.NuevaClave.Trim();
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("CambiarClavePadre");

        // ── PATCH /api/padres/{id}/estado  → toggle activo/inactivo
        group.MapPatch("/{id:int}/estado", async (int id, KumamotoDbContext db) =>
        {
            var padre = await db.Usuarios.FindAsync(id);
            if (padre is null || padre.RolId != ROL_PADRE) return Results.NotFound();
            padre.Estado = padre.Estado == 1 ? (short)0 : (short)1;
            await db.SaveChangesAsync();
            return Results.Ok(new { padre.Estado });
        }).WithName("TogglePadreEstado");

        // ── DELETE /api/padres/{id}  → eliminación lógica
        group.MapDelete("/{id:int}", async (int id, KumamotoDbContext db) =>
        {
            var padre = await db.Usuarios.FindAsync(id);
            if (padre is null || padre.RolId != ROL_PADRE) return Results.NotFound();
            padre.Estado = 0;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("DeletePadre");

        // ── GET /api/padres/me/estudiante/resumen  → portal del padre
        group.MapGet("/me/estudiante/resumen", async (System.Security.Claims.ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            var estudiante = await db.Estudiantes
                .Include(e => e.Aula).ThenInclude(a => a!.Grado)
                .Include(e => e.Aula).ThenInclude(a => a!.Seccion)
                .FirstOrDefaultAsync(e => e.PadreId == userId && e.Estado == 1);

            if (estudiante is null) return Results.NotFound(new { mensaje = "No se encontró un estudiante vinculado activo." });

            // Asistencia: 1 query con GroupBy en vez de 2 Count separados
            var statsAsist = await db.Asistencias
                .Where(a => a.EstudianteId == estudiante.Id && a.Estado == 1)
                .GroupBy(_ => 1)
                .Select(g => new
                {
                    Total    = g.Count(),
                    Presentes = g.Count(a => a.Valor == "P" || a.Valor == "T" || a.Valor == "J")
                })
                .FirstOrDefaultAsync();

            int porcentajeAsistencia = statsAsist is { Total: > 0 }
                ? (int)Math.Round((double)statsAsist.Presentes / statsAsist.Total * 100)
                : 100;
            var estadoAsistencia = porcentajeAsistencia >= 95 ? "Excelente" : (porcentajeAsistencia >= 85 ? "Regular" : "Crítico");

            // Notas recientes (usando modelo EF Core 5NF con soporte para Carga Académica)
            var calificaciones = await db.Calificaciones
                .Include(c => c.Competencia).ThenInclude(comp => comp!.Curso)
                .Include(c => c.Competencia).ThenInclude(comp => comp!.Carga).ThenInclude(ca => ca!.Curso)
                .Include(c => c.Escala)
                .Where(c => c.EstudianteId == estudiante.Id && c.Estado == 1)
                .OrderByDescending(c => c.FechaRegistro)
                .Take(4)
                .Select(c => new { 
                    curso = c.Competencia != null ? (c.Competencia.Curso != null ? c.Competencia.Curso.Nombre : (c.Competencia.Carga != null && c.Competencia.Carga.Curso != null ? c.Competencia.Carga.Curso.Nombre : "Curso General")) : "Curso General", 
                    nota = c.Escala!.Letra 
                })
                .ToListAsync();

            // Alertas de Riesgo
            var alertas = await db.AlertasRiesgo
                .Where(a => a.EstudianteId == estudiante.Id && a.Estado == 1 && a.NivelRiesgo == "Alto")
                .OrderByDescending(a => a.Id)
                .Select(a => new { tipo = $"Riesgo {a.NivelRiesgo}", mensaje = a.Motivo })
                .ToListAsync();

            return Results.Ok(new
            {
                id = estudiante.Id,
                estudiante = $"{estudiante.Nombres} {estudiante.Apellidos}",
                grado = estudiante.Aula != null ? $"{estudiante.Aula.Grado!.Nombre} - Sección {estudiante.Aula.Seccion!.Letra}" : "Sin Aula Asignada",
                asistencia = new
                {
                    porcentaje = porcentajeAsistencia,
                    estado = estadoAsistencia
                },
                rendimiento = calificaciones,
                alertas = alertas
            });
        }).WithName("GetResumenHijo");

        // ── GET /api/padres/me/estudiante/asistencias
        group.MapGet("/me/estudiante/asistencias", async (System.Security.Claims.ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            var estudiante = await db.Estudiantes.FirstOrDefaultAsync(e => e.PadreId == userId && e.Estado == 1);
            if (estudiante is null) return Results.NotFound();

            var asistencias = await db.Asistencias
                .Where(a => a.EstudianteId == estudiante.Id && a.Estado == 1 && (a.Valor == "F" || a.Valor == "T" || a.Valor == "J"))
                .OrderByDescending(a => a.Fecha)
                .Select(a => new 
                { 
                    fecha = a.Fecha, 
                    estado = a.Valor == "F" ? "Falta" : (a.Valor == "T" ? "Tardanza" : "Justificado") 
                })
                .ToListAsync();

            return Results.Ok(asistencias);
        }).WithName("GetAsistenciasHijo");

        // ── GET /api/padres/asistencias/{id_estudiante}
        group.MapGet("/asistencias/{id:int}", async (int id, System.Security.Claims.ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            var estudiante = await db.Estudiantes
                .Include(e => e.Aula).ThenInclude(a => a!.Grado)
                .Include(e => e.Aula).ThenInclude(a => a!.Seccion)
                .FirstOrDefaultAsync(e => e.Id == id && e.PadreId == userId && e.Estado == 1);

            if (estudiante is null) return Results.NotFound(new { mensaje = "Estudiante no encontrado o no autorizado." });

            // 1. Obtener todas las asistencias del estudiante
            var asistenciasDb = await db.Asistencias
                .Include(a => a.CargaAcademica).ThenInclude(c => c!.Curso)
                .Include(a => a.RegistradoPor).ThenInclude(u => u!.Rol)
                .Where(a => a.EstudianteId == estudiante.Id && a.Estado == 1)
                .OrderByDescending(a => a.Fecha)
                .ToListAsync();

            // 2. Obtener todas las incidencias del estudiante
            var incidenciasDb = await db.Incidencias
                .Include(i => i.RegistradoPor).ThenInclude(u => u!.Rol)
                .Where(i => i.EstudianteId == estudiante.Id && i.Estado == 1)
                .OrderByDescending(i => i.FechaRegistro)
                .Select(i => new
                {
                    id = i.Id,
                    tipo = i.TipoIncidencia,
                    descripcion = i.Descripcion ?? "Sin descripción",
                    fecha = i.FechaRegistro.ToString("yyyy-MM-dd HH:mm"),
                    registradoPor = i.RegistradoPor != null ? $"{i.RegistradoPor.Nombres} {i.RegistradoPor.Apellidos} ({i.RegistradoPor.Rol!.Nombre})" : "Personal Institucional"
                })
                .ToListAsync();

            // 3. Consolidar por curso para el resumen de faltas y tardanzas
            var cargasAula = await db.CargasAcademicas
                .Include(c => c.Curso)
                .Where(c => c.AulaId == estudiante.AulaId && c.Estado == 1)
                .ToListAsync();

            var nombresCursos = cargasAula.Select(c => c.Curso?.Nombre ?? "Curso General").Distinct().ToList();
            var cursosConAsistencia = asistenciasDb.Select(a => a.CargaAcademica?.Curso?.Nombre ?? "Asistencia General / Tutoría").Distinct();
            var todosLosCursos = nombresCursos.Union(cursosConAsistencia).Distinct().OrderBy(c => c).ToList();

            var resumenCursos = new List<object>();
            foreach (var curso in todosLosCursos)
            {
                var asisCurso = asistenciasDb.Where(a => (a.CargaAcademica?.Curso?.Nombre ?? "Asistencia General / Tutoría") == curso).ToList();
                int presentes = asisCurso.Count(a => a.Valor == "P");
                int faltas = asisCurso.Count(a => a.Valor == "F");
                int tardanzas = asisCurso.Count(a => a.Valor == "T");
                int justificados = asisCurso.Count(a => a.Valor == "J");

                resumenCursos.Add(new
                {
                    curso = curso,
                    presentes = presentes,
                    faltas = faltas,
                    tardanzas = tardanzas,
                    justificados = justificados,
                    total = asisCurso.Count
                });
            }

            var historialAsistencias = asistenciasDb.Select(a => new
            {
                id = a.Id,
                curso = a.CargaAcademica?.Curso?.Nombre ?? "Asistencia General / Tutoría",
                fecha = a.Fecha.ToString("yyyy-MM-dd"),
                valor = a.Valor, // P, F, T, J
                estado = a.Valor == "P" ? "Asistió" : (a.Valor == "F" ? "Falta" : (a.Valor == "T" ? "Tardanza" : "Justificado")),
                registradoPor = a.RegistradoPor != null ? $"{a.RegistradoPor.Nombres} {a.RegistradoPor.Apellidos} ({a.RegistradoPor.Rol!.Nombre})" : "Docente / Auxiliar"
            }).ToList();

            return Results.Ok(new
            {
                estudiante = $"{estudiante.Nombres} {estudiante.Apellidos}",
                grado = estudiante.Aula != null ? $"{estudiante.Aula.Grado!.Nombre} - Sección {estudiante.Aula.Seccion!.Letra}" : "",
                resumenCursos = resumenCursos,
                historialAsistencias = historialAsistencias,
                incidencias = incidenciasDb
            });
        }).WithName("GetAsistenciasEIncidenciasHijo");

        // ── GET /api/padres/dashboard/{dni}  → portal multi-hijo
        app.MapGet("/api/parent/dashboard/{dni}", async (string dni, KumamotoDbContext db) =>
        {
            var padre = await db.Usuarios.FirstOrDefaultAsync(u => u.Dni == dni && u.RolId == ROL_PADRE && u.Estado == 1);
            if (padre == null) return Results.NotFound(new { mensaje = "Padre no encontrado." });

            var hijos = await db.Estudiantes
                .Include(e => e.Aula).ThenInclude(a => a!.Grado)
                .Include(e => e.Aula).ThenInclude(a => a!.Seccion)
                .Where(e => e.PadreId == padre.Id && e.Estado == 1)
                .ToListAsync();

            var hoy = DateOnly.FromDateTime(DateTime.Today);
            var resultados = new List<object>();

            // ── Cargar datos de TODOS los hijos en 3 queries (antes era N×3) ──
            var hijoIds = hijos.Select(h => h.Id).ToList();

            // Riesgos: último por estudiante
            var riesgosDict = await db.AlumnosRiesgo
                .Where(r => hijoIds.Contains(r.EstudianteId) && r.Estado == 1)
                .OrderByDescending(r => r.FechaCalculo)
                .ToListAsync();
            var riesgosPorHijo = riesgosDict
                .GroupBy(r => r.EstudianteId)
                .ToDictionary(g => g.Key, g => g.First());

            // Asistencia: stats por estudiante en 1 query
            var asistStats = await db.Asistencias
                .Where(a => hijoIds.Contains(a.EstudianteId) && a.Estado == 1)
                .GroupBy(a => a.EstudianteId)
                .Select(g => new
                {
                    EstudianteId = g.Key,
                    Total  = g.Count(),
                    Faltas = g.Count(a => a.Valor == "F"),
                    Presentes = g.Count(a => a.Valor == "P" || a.Valor == "T" || a.Valor == "J")
                })
                .ToListAsync();
            var asistPorHijo = asistStats.ToDictionary(s => s.EstudianteId);

            // Asistencia diaria más reciente de cada estudiante (por si hoy no hay clases o aún no toman asistencia)
            var ultimasAsistencias = await db.Asistencias
                .Include(a => a.CargaAcademica).ThenInclude(c => c!.Curso)
                .Where(a => hijoIds.Contains(a.EstudianteId) && a.Estado == 1)
                .OrderByDescending(a => a.Fecha)
                .ToListAsync();

            // Notas recientes y cursos con dificultad: en 1 query con semana y carga académica incluida
            var notasTodas = await db.Calificaciones
                .Include(c => c.Semana)
                .Where(c => c.EstudianteId != null && hijoIds.Contains(c.EstudianteId.Value) && c.Estado == 1)
                .OrderByDescending(c => c.FechaRegistro)
                .Select(c => new
                {
                    EstudianteId = c.EstudianteId!.Value,
                    curso        = c.Competencia != null ? (c.Competencia.Curso != null ? c.Competencia.Curso.Nombre : (c.Competencia.Carga != null && c.Competencia.Carga.Curso != null ? c.Competencia.Carga.Curso.Nombre : "Curso General")) : "Curso General",
                    competencia  = c.Competencia != null ? c.Competencia.Nombre : "Evaluación General",
                    codigo       = c.Competencia != null ? c.Competencia.Codigo : "-",
                    nota         = c.Escala!.Letra,
                    semana       = c.Semana != null ? c.Semana.NumeroSemana : 0,
                    fecha        = c.FechaRegistro
                })
                .ToListAsync();

            // ── Ensamblar respuesta en memoria (sin más queries) ──
            foreach (var hijo in hijos)
            {
                riesgosPorHijo.TryGetValue(hijo.Id, out var riesgo);
                asistPorHijo.TryGetValue(hijo.Id, out var asist);
                var pctAsistencia = asist is { Total: > 0 }
                    ? (double)asist.Presentes / asist.Total * 100
                    : 100;

                var asisHijoAll = ultimasAsistencias.Where(a => a.EstudianteId == hijo.Id).ToList();
                string asisHoyValor = "Sin registro";
                string asisHoyCurso = "Sin registros previos";
                string asisHoyFecha = hoy.ToString("dd/MM/yyyy");

                if (asisHijoAll.Any())
                {
                    // Buscar si hay de hoy
                    var asisHoy = asisHijoAll.Where(a => a.Fecha == hoy).ToList();
                    var registroDiario = asisHoy.FirstOrDefault(a => a.CargaAcademicaId == null) ?? asisHoy.FirstOrDefault();

                    // Si no hay de hoy, tomar la más reciente de cualquier fecha anterior
                    if (registroDiario == null)
                    {
                        registroDiario = asisHijoAll.FirstOrDefault(a => a.CargaAcademicaId == null) ?? asisHijoAll.First();
                    }

                    asisHoyValor = registroDiario.Valor == "P" ? "Presente" : (registroDiario.Valor == "F" ? "Falta" : (registroDiario.Valor == "T" ? "Tardanza" : "Justificado"));
                    asisHoyCurso = registroDiario.CargaAcademica?.Curso?.Nombre ?? "Asistencia General";
                    asisHoyFecha = registroDiario.Fecha.ToString("dd/MM/yyyy");
                }

                var notasDelHijo = notasTodas.Where(n => n.EstudianteId == hijo.Id).ToList();
                var ultimasNotas = notasDelHijo.Take(4).ToList();

                // Obtener la última nota de cada competencia para evaluar si está en dificultad (B o C)
                var ultimasPorComp = notasDelHijo
                    .GroupBy(n => new { n.curso, n.competencia, n.codigo })
                    .Select(g => g.OrderByDescending(x => x.fecha).First())
                    .ToList();

                var malasPorComp = ultimasPorComp
                    .Where(x => x.nota != null && (x.nota.Trim().ToUpper() == "B" || x.nota.Trim().ToUpper() == "C"))
                    .ToList();

                var cursosMalos = malasPorComp
                    .GroupBy(x => x.curso)
                    .Select(gCurso => new {
                        curso = gCurso.Key,
                        competencias = gCurso.Select(c => new {
                            codigo = c.codigo,
                            competencia = c.competencia,
                            nota = c.nota.Trim().ToUpper(),
                            semana = c.semana
                        }).ToList()
                    }).ToList();

                string rawMotivo = riesgo?.Motivo ?? "Sin incidencias reportadas.";
                string motivoLimpio = rawMotivo;
                if (rawMotivo.Contains("Cursos y Competencias Críticas:"))
                {
                    motivoLimpio = rawMotivo.Substring(0, rawMotivo.IndexOf("Cursos y Competencias Críticas:")).Trim();
                }

                string iaRecomendacion = riesgo?.Recomendacion ?? "Siga apoyando el progreso académico de su hijo.";
                if (malasPorComp.Any())
                {
                    int countB = malasPorComp.Count(x => x.nota.Trim().ToUpper() == "B");
                    int countC = malasPorComp.Count(x => x.nota.Trim().ToUpper() == "C");
                    
                    if (countC > 0)
                    {
                        iaRecomendacion = $"ALERTA CRÍTICA DE IA: El estudiante presenta {countC} competencia(s) en nivel C (Deficiente) y {countB} en nivel B. Se requiere una reunión urgente con el tutor del aula para establecer un plan de recuperación inmediato.";
                    }
                    else if (countB > 0)
                    {
                        iaRecomendacion = $"ALERTA TEMPRANA DE IA: Se han detectado {countB} competencia(s) en nivel B (Regular). Sugerimos coordinar con los docentes para reforzar los aprendizajes antes de las evaluaciones finales.";
                    }
                }

                resultados.Add(new
                {
                    id     = hijo.Id,
                    nombre = $"{hijo.Nombres} {hijo.Apellidos}",
                    grado  = hijo.Aula != null ? $"{hijo.Aula.Grado!.Nombre} {hijo.Aula.Seccion!.Letra}" : "N/A",
                    riesgo = new
                    {
                        nivel         = riesgo?.NivelRiesgo ?? "Bajo",
                        motivo        = motivoLimpio,
                        recomendacion = iaRecomendacion,
                        fecha         = riesgo?.FechaCalculo
                    },
                    asistencia = new
                    {
                        porcentaje = Math.Round(pctAsistencia, 0),
                        faltas     = asist?.Faltas ?? 0,
                        total      = asist?.Total  ?? 0,
                        hoy        = asisHoyValor,
                        hoyCurso   = asisHoyCurso,
                        hoyFecha   = asisHoyFecha
                    },
                    ultimasNotas = ultimasNotas,
                    cursosMalos  = cursosMalos
                });
            }

            return Results.Ok(new
            {
                padre = $"{padre.Nombres} {padre.Apellidos}",
                hijos = resultados
            });
        }).AllowAnonymous(); // Permitimos acceso por DNI para el dashboard de padres según requerimiento

        // ── GET /api/padres/libreta/{id_estudiante}
        group.MapGet("/libreta/{id:int}", async (int id, System.Security.Claims.ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            // Validar que el estudiante pertenezca al padre
            var estudiante = await db.Estudiantes
                .Include(e => e.Aula).ThenInclude(a => a!.Grado)
                .Include(e => e.Aula).ThenInclude(a => a!.Seccion)
                .FirstOrDefaultAsync(e => e.Id == id && e.PadreId == userId && e.Estado == 1);

            if (estudiante is null) return Results.NotFound(new { mensaje = "No autorizado o estudiante no encontrado." });

            // 1. Obtener todas las cargas académicas del aula del estudiante para tener la lista completa de cursos registrados
            var cargas = await db.CargasAcademicas
                .Include(ca => ca.Curso)
                .Where(ca => ca.AulaId == estudiante.AulaId && ca.Estado == 1)
                .ToListAsync();

            var calificaciones = await db.Calificaciones
                .Include(c => c.Competencia).ThenInclude(comp => comp!.Curso)
                .Include(c => c.Competencia).ThenInclude(comp => comp!.Carga).ThenInclude(ca => ca!.Curso)
                .Include(c => c.Semana).ThenInclude(s => s!.Periodo)
                .Include(c => c.Escala)
                .Where(c => c.EstudianteId == estudiante.Id && c.Estado == 1)
                .ToListAsync();

            var nombresCursos = cargas.Select(ca => ca.Curso?.Nombre ?? "Curso General").Distinct().ToList();
            var cursosConNotas = calificaciones.Select(c => c.Competencia?.Curso?.Nombre ?? (c.Competencia?.Carga?.Curso?.Nombre ?? "Curso General")).Distinct();
            var todosLosCursos = nombresCursos.Union(cursosConNotas).Distinct().OrderBy(c => c).ToList();

            var periodosDb = await db.PeriodosAcademicos
                .OrderBy(p => p.Numero)
                .ToListAsync();

            var periodos = periodosDb.Select(p => p.Nombre).Distinct().ToList();

            var bimestresEstandar = new List<string> { "1° Bimestre", "2° Bimestre", "3° Bimestre", "4° Bimestre" };
            foreach (var b in bimestresEstandar)
            {
                if (!periodos.Contains(b))
                {
                    periodos.Add(b);
                }
            }

            var historial = new List<object>();

            var califsPlanificadas = calificaciones.Select(c => new
            {
                Periodo = c.Semana?.Periodo?.Nombre ?? "Periodo General",
                Curso = c.Competencia?.Curso?.Nombre ?? (c.Competencia?.Carga?.Curso?.Nombre ?? "Curso General"),
                CodigoComp = c.Competencia?.Codigo ?? "-",
                NombreComp = c.Competencia?.Nombre ?? "Evaluación General",
                IdComp = c.Competencia?.Id ?? 0,
                NumeroSemana = c.Semana?.NumeroSemana ?? 0,
                Letra = c.Escala?.Letra ?? "-",
                Fecha = c.FechaRegistro
            }).ToList();

            var califsPorCurso = califsPlanificadas.ToLookup(c => c.Curso);

            var competenciasPorCurso = new Dictionary<string, List<dynamic>>();
            foreach (var curso in todosLosCursos)
            {
                var califsDelCurso = califsPorCurso[curso];
                var comps = califsDelCurso
                    .Where(c => c.CodigoComp != "-")
                    .GroupBy(c => c.CodigoComp)
                    .Select(g => new {
                        Codigo = g.Key,
                        Nombre = g.OrderByDescending(c => c.IdComp).First().NombreComp
                    })
                    .OrderBy(c => c.Codigo)
                    .ToList<dynamic>();

                if (!comps.Any())
                {
                    comps.Add(new { Codigo = "C1", Nombre = "Evaluación General del Curso" });
                }
                competenciasPorCurso[curso] = comps;
            }

            foreach (var periodo in periodos)
            {
                var cursosBimestre = new List<object>();

                foreach (var nombreCurso in todosLosCursos)
                {
                    var califsCursoPeriodo = califsPorCurso[nombreCurso]
                        .Where(c => c.Periodo == periodo)
                        .ToList();

                    var competenciasDelCurso = competenciasPorCurso[nombreCurso];
                    var listaCompetencias = new List<object>();
                    double sumCursoNum = 0;
                    int countCursoComp = 0;

                    foreach (var comp in competenciasDelCurso)
                    {
                        var califComp = califsCursoPeriodo
                            .Where(c => c.CodigoComp == comp.Codigo)
                            .GroupBy(c => c.NumeroSemana)
                            .Select(g => g.OrderByDescending(c => c.Fecha).First())
                            .OrderBy(c => c.NumeroSemana)
                            .ToList();

                        var semanasComp = califComp.Select(c => new {
                            semana = $"Semana {c.NumeroSemana}",
                            nota = c.Letra
                        }).ToList();

                        double sumComp = 0;
                        int countComp = califComp.Count;
                        foreach (var c in califComp)
                        {
                            var l = c.Letra;
                            if (l == "AD") sumComp += 20;
                            else if (l == "A") sumComp += 16;
                            else if (l == "B") sumComp += 12;
                            else if (l == "C") sumComp += 8;
                        }

                        string promCompLiteral = "-";
                        if (countComp > 0)
                        {
                            double avg = sumComp / countComp;
                            sumCursoNum += avg;
                            countCursoComp++;

                            if (avg >= 17.5) promCompLiteral = "AD";
                            else if (avg >= 14.0) promCompLiteral = "A";
                            else if (avg >= 11.0) promCompLiteral = "B";
                            else promCompLiteral = "C";
                        }

                        listaCompetencias.Add(new {
                            codigo = comp.Codigo,
                            nombre = comp.Nombre,
                            semanas = semanasComp,
                            promedioBimestre = promCompLiteral
                        });
                    }

                    string promCursoLiteral = "-";
                    if (countCursoComp > 0)
                    {
                        double avgCurso = sumCursoNum / countCursoComp;
                        if (avgCurso >= 17.5) promCursoLiteral = "AD";
                        else if (avgCurso >= 14.0) promCursoLiteral = "A";
                        else if (avgCurso >= 11.0) promCursoLiteral = "B";
                        else promCursoLiteral = "C";
                    }

                    cursosBimestre.Add(new {
                        curso = nombreCurso,
                        promedioCurso = promCursoLiteral,
                        competencias = listaCompetencias
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
        }).WithName("GetLibretaEstudiante");

        // ── GET /api/padres/horario/{id}  → horario semanal del estudiante
        group.MapGet("/horario/{id:int}", async (int id, System.Security.Claims.ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            var estudiante = await db.Estudiantes
                .Include(e => e.Aula).ThenInclude(a => a!.Grado)
                .Include(e => e.Aula).ThenInclude(a => a!.Seccion)
                .FirstOrDefaultAsync(e => e.Id == id && e.PadreId == userId && e.Estado == 1);

            if (estudiante is null) return Results.NotFound(new { mensaje = "Estudiante no encontrado o no autorizado." });

            var horarioDb = await db.HorarioDetalle
                .Include(h => h.Carga).ThenInclude(c => c!.Curso)
                .Include(h => h.Carga).ThenInclude(c => c!.Docente)
                .Where(h => h.Carga!.AulaId == estudiante.AulaId && h.Estado == 1 && h.Carga.Estado == 1)
                .OrderBy(h => h.HoraInicio)
                .ToListAsync();

            var dias = new List<string> { "Lunes", "Martes", "Miércoles", "Jueves", "Viernes" };
            var horarioPorDia = new List<object>();

            foreach (var dia in dias)
            {
                var clasesDia = horarioDb
                    .Where(h => h.DiaSemana == dia)
                    .Select(h => new
                    {
                        id = h.Id,
                        curso = h.Carga?.Curso?.Nombre ?? "Curso General",
                        docente = h.Carga?.Docente != null ? $"{h.Carga.Docente.Nombres} {h.Carga.Docente.Apellidos}" : "Docente Asignado",
                        horaInicio = h.HoraInicio.ToString("HH:mm"),
                        horaFin = h.HoraFin.ToString("HH:mm")
                    })
                    .ToList();

                horarioPorDia.Add(new
                {
                    dia = dia,
                    clases = clasesDia
                });
            }

            return Results.Ok(new
            {
                estudiante = $"{estudiante.Nombres} {estudiante.Apellidos}",
                grado = estudiante.Aula != null ? $"{estudiante.Aula.Grado!.Nombre} - Sección {estudiante.Aula.Seccion!.Letra}" : "",
                horario = horarioPorDia
            });
        }).WithName("GetHorarioEstudiante");
    }

    private static int? GetUserId(System.Security.Claims.ClaimsPrincipal user)
    {
        var claim = user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                    ?? user.FindFirst("sub")?.Value;

        if (int.TryParse(claim, out var id)) return id;
        return null;
    }
}
