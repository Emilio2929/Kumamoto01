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
                    u.Id, u.Dni, u.Nombres, u.Apellidos, u.Correo, u.Telefono, u.Estado
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
                    u.Id, u.Dni, u.Nombres, u.Apellidos, u.Correo, u.Telefono, u.Estado
                ))
                .FirstOrDefaultAsync();

            return padre is null
                ? Results.NotFound(new { mensaje = "No se encontró ningún padre con ese DNI." })
                : Results.Ok(padre);
        }).WithName("BuscarPadrePorDni");

        // ── POST /api/padres  → crear padre con credenciales auto-generadas
        group.MapPost("/", async (CreatePadreDto dto, KumamotoDbContext db) =>
        {
            // El correo es opcional para padres. Si no se provee, se genera uno institucional p[DNI]
            var correoFinal = string.IsNullOrWhiteSpace(dto.Correo) 
                ? $"p{dto.Dni}@kumamoto.edu.pe" 
                : dto.Correo.Trim().ToLower();

            var existeDni = await db.Usuarios.AnyAsync(u => u.Dni == dto.Dni);
            if (existeDni)
                return Results.Conflict(new { mensaje = "Ya existe un usuario con ese DNI." });

            var existeCorreo = await db.Usuarios.AnyAsync(u => u.Correo == correoFinal);
            if (existeCorreo)
                return Results.Conflict(new { mensaje = "Ese correo ya está registrado." });

            var clave = $"Kuma{dto.Dni}";

            var padre = new Usuario
            {
                Dni = dto.Dni.Trim(),
                Nombres = dto.Nombres.Trim(),
                Apellidos = dto.Apellidos.Trim(),
                Correo = correoFinal,
                Telefono = dto.Telefono?.Trim(),
                ClaveHash = clave,
                RolId = ROL_PADRE,
                Estado = 1
            };
            db.Usuarios.Add(padre);
            await db.SaveChangesAsync();

            var msg = string.IsNullOrWhiteSpace(dto.Correo)
                ? $"Padre registrado con correo institucional: {correoFinal}. Clave: {clave}"
                : $"Padre registrado. Credenciales enviadas a {correoFinal}. Clave: {clave}";

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

            // Verificar correo único si se cambia
            if (!string.IsNullOrWhiteSpace(dto.Correo))
            {
                var duplicado = await db.Usuarios.AnyAsync(u => u.Correo == dto.Correo && u.Id != id);
                if (duplicado)
                    return Results.Conflict(new { mensaje = "Ese correo ya está en uso." });
            }

            padre.Nombres = dto.Nombres.Trim();
            padre.Apellidos = dto.Apellidos?.Trim() ?? padre.Apellidos;
            padre.Correo = string.IsNullOrWhiteSpace(dto.Correo) ? padre.Correo : dto.Correo.Trim();
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
                    Presentes = g.Count(a => a.Valor == "P" || a.Valor == "T")
                })
                .FirstOrDefaultAsync();

            int porcentajeAsistencia = statsAsist is { Total: > 0 }
                ? (int)Math.Round((double)statsAsist.Presentes / statsAsist.Total * 100)
                : 100;
            var estadoAsistencia = porcentajeAsistencia >= 95 ? "Excelente" : (porcentajeAsistencia >= 85 ? "Regular" : "Crítico");

            // Notas recientes (usando modelo EF Core 5NF)
            var calificaciones = await db.Calificaciones
                .Include(c => c.Competencia).ThenInclude(comp => comp!.Curso)
                .Include(c => c.Escala)
                .Where(c => c.EstudianteId == estudiante.Id && c.Estado == 1)
                .OrderByDescending(c => c.FechaRegistro)
                .Take(4)
                .Select(c => new { curso = c.Competencia!.Curso!.Nombre, nota = c.Escala!.Letra })
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
                    Faltas = g.Count(a => a.Valor == "F")
                })
                .ToListAsync();
            var asistPorHijo = asistStats.ToDictionary(s => s.EstudianteId);

            // Notas recientes: Top 4 por estudiante en 1 query
            var notasTodas = await db.Calificaciones
                .Where(c => c.EstudianteId != null && hijoIds.Contains(c.EstudianteId.Value) && c.Estado == 1)
                .OrderByDescending(c => c.FechaRegistro)
                .Select(c => new
                {
                    EstudianteId = c.EstudianteId!.Value,
                    curso        = c.Competencia!.Curso!.Nombre,
                    competencia  = c.Competencia.Nombre,
                    codigo       = c.Competencia.Codigo,
                    nota         = c.Escala!.Letra,
                    fecha        = c.FechaRegistro
                })
                .ToListAsync();
            var notasPorHijo = notasTodas
                .GroupBy(n => n.EstudianteId)
                .ToDictionary(g => g.Key, g => g.Take(4).ToList());

            // ── Ensamblar respuesta en memoria (sin más queries) ──
            foreach (var hijo in hijos)
            {
                riesgosPorHijo.TryGetValue(hijo.Id, out var riesgo);
                asistPorHijo.TryGetValue(hijo.Id, out var asist);
                var pctAsistencia = asist is { Total: > 0 }
                    ? (double)(asist.Total - asist.Faltas) / asist.Total * 100
                    : 100;

                resultados.Add(new
                {
                    id     = hijo.Id,
                    nombre = $"{hijo.Nombres} {hijo.Apellidos}",
                    grado  = hijo.Aula != null ? $"{hijo.Aula.Grado!.Nombre} {hijo.Aula.Seccion!.Letra}" : "N/A",
                    riesgo = new
                    {
                        nivel         = riesgo?.NivelRiesgo ?? "Bajo",
                        motivo        = riesgo?.Motivo ?? "Sin incidencias reportadas.",
                        recomendacion = riesgo?.Recomendacion ?? "Siga apoyando el progreso de su hijo.",
                        fecha         = riesgo?.FechaCalculo
                    },
                    asistencia = new
                    {
                        porcentaje = Math.Round(pctAsistencia, 0),
                        faltas     = asist?.Faltas ?? 0,
                        total      = asist?.Total  ?? 0
                    },
                    ultimasNotas = notasPorHijo.TryGetValue(hijo.Id, out var notas) ? notas : new()
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

            var calificaciones = await db.Calificaciones
                .Include(c => c.Competencia).ThenInclude(comp => comp!.Curso)
                .Include(c => c.Semana).ThenInclude(s => s!.Periodo)
                .Include(c => c.Escala)
                .Where(c => c.EstudianteId == estudiante.Id && c.Estado == 1)
                .ToListAsync();

            var bimestres = calificaciones
                .Where(c => c.Semana?.Periodo != null && c.Competencia?.Curso != null && c.Escala != null)
                .GroupBy(c => c.Semana!.Periodo!.Nombre)
                .Select(gb => new
                {
                    bimestre = gb.Key,
                    cursos = gb.GroupBy(c => c.Competencia!.Curso!.Nombre)
                               .Select(gc => new {
                                   curso = gc.Key,
                                   nota = gc.OrderByDescending(c => c.FechaRegistro).FirstOrDefault()?.Escala?.Letra ?? "-"
                               }).ToList()
                }).ToList();

            return Results.Ok(new 
            {
                estudiante = $"{estudiante.Nombres} {estudiante.Apellidos}",
                grado = estudiante.Aula != null ? $"{estudiante.Aula.Grado!.Nombre} - Sección {estudiante.Aula.Seccion!.Letra}" : "",
                historial = bimestres
            });
        }).WithName("GetLibretaEstudiante");
    }

    private static int? GetUserId(System.Security.Claims.ClaimsPrincipal user)
    {
        var claim = user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                    ?? user.FindFirst("sub")?.Value;

        if (int.TryParse(claim, out var id)) return id;
        return null;
    }
}
