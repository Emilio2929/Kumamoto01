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
            if (string.IsNullOrWhiteSpace(dto.Dni) || dto.Dni.Length != 8)
                return Results.BadRequest(new { mensaje = "El DNI debe tener 8 dígitos." });
            if (string.IsNullOrWhiteSpace(dto.Nombres))
                return Results.BadRequest(new { mensaje = "El nombre es requerido." });
            if (string.IsNullOrWhiteSpace(dto.Apellidos))
                return Results.BadRequest(new { mensaje = "Los apellidos son requeridos." });

            var existeDni = await db.Usuarios.AnyAsync(u => u.Dni == dto.Dni);
            if (existeDni)
                return Results.Conflict(new { mensaje = "Ya existe un usuario con ese DNI." });

            // Generar correo y contraseña institucional
            var correo = $"p{dto.Dni}@kumamoto.edu.pe";
            var clave = $"Kuma{dto.Dni}";

            var existeCorreo = await db.Usuarios.AnyAsync(u => u.Correo == correo);
            if (existeCorreo)
                return Results.Conflict(new { mensaje = "Ya existe un usuario con ese correo institucional." });

            var padre = new Usuario
            {
                Dni = dto.Dni.Trim(),
                Nombres = dto.Nombres.Trim(),
                Apellidos = dto.Apellidos.Trim(),
                Correo = correo,
                Telefono = dto.Telefono?.Trim(),
                ClaveHash = clave,
                RolId = ROL_PADRE,
                Estado = 1
            };
            db.Usuarios.Add(padre);
            await db.SaveChangesAsync();

            return Results.Created($"/api/padres/{padre.Id}", new
            {
                padre.Id,
                correo,
                claveGenerada = clave,
                mensaje = $"Credenciales generadas: correo={correo} | clave={clave}"
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

            // Asistencia (Total % presente)
            var totalAsistencias = await db.Asistencias.CountAsync(a => a.EstudianteId == estudiante.Id && a.Estado == 1);
            var totalPresentes = await db.Asistencias.CountAsync(a => a.EstudianteId == estudiante.Id && (a.Valor == "P" || a.Valor == "T") && a.Estado == 1);
            
            int porcentajeAsistencia = totalAsistencias > 0 ? (int)Math.Round((double)totalPresentes / totalAsistencias * 100) : 100;
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

            foreach (var hijo in hijos)
            {
                // Riesgo actual
                var riesgo = await db.AlumnosRiesgo
                    .Where(r => r.EstudianteId == hijo.Id && r.Estado == 1)
                    .OrderByDescending(r => r.FechaCalculo)
                    .FirstOrDefaultAsync();

                // Asistencia
                var totalAsistencias = await db.Asistencias.CountAsync(a => a.EstudianteId == hijo.Id && a.Estado == 1);
                var totalFaltas = await db.Asistencias.CountAsync(a => a.EstudianteId == hijo.Id && a.Valor == "F" && a.Estado == 1);
                var pctAsistencia = totalAsistencias > 0 ? (double)(totalAsistencias - totalFaltas) / totalAsistencias * 100 : 100;

                // Notas recientes con detalle de competencia
                var notas = await db.Calificaciones
                    .Include(c => c.Competencia).ThenInclude(comp => comp!.Curso)
                    .Include(c => c.Escala)
                    .Where(c => c.EstudianteId == hijo.Id && c.Estado == 1)
                    .OrderByDescending(c => c.FechaRegistro)
                    .Take(4)
                    .Select(c => new { 
                        curso = c.Competencia!.Curso!.Nombre, 
                        competencia = c.Competencia.Nombre,
                        codigo = c.Competencia.Codigo,
                        nota = c.Escala!.Letra, 
                        fecha = c.FechaRegistro 
                    })
                    .ToListAsync();

                resultados.Add(new
                {
                    id = hijo.Id,
                    nombre = $"{hijo.Nombres} {hijo.Apellidos}",
                    grado = hijo.Aula != null ? $"{hijo.Aula.Grado!.Nombre} {hijo.Aula.Seccion!.Letra}" : "N/A",
                    riesgo = new
                    {
                        nivel = riesgo?.NivelRiesgo ?? "Bajo",
                        motivo = riesgo?.Motivo ?? "Sin incidencias reportadas.",
                        recomendacion = riesgo?.Recomendacion ?? "Siga apoyando el progreso de su hijo.",
                        fecha = riesgo?.FechaCalculo
                    },
                    asistencia = new
                    {
                        porcentaje = Math.Round(pctAsistencia, 0),
                        faltas = totalFaltas,
                        total = totalAsistencias
                    },
                    ultimasNotas = notas
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
                .Where(c => c.Semana?.Periodo != null)
                .GroupBy(c => c.Semana!.Periodo!.Nombre)
                .Select(gb => new
                {
                    bimestre = gb.Key,
                    cursos = gb.GroupBy(c => c.Competencia!.Curso!.Nombre)
                               .Select(gc => new {
                                   curso = gc.Key,
                                   nota = gc.OrderByDescending(c => c.FechaRegistro).First().Escala!.Letra
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
