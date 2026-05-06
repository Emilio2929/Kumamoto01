using Kumamoto.API.Data;
using Kumamoto.API.DTOs;
using Kumamoto.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Endpoints;

public static class DocentesEndpoints
{
    private const int ROL_DOCENTE = 2;

    public static void MapDocentesEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/docentes").WithTags("Docentes").RequireAuthorization();

        // ── GET /api/docentes  → todos los docentes
        group.MapGet("/", async (KumamotoDbContext db) =>
        {
            var docentes = await db.Usuarios
                .Where(u => u.RolId == ROL_DOCENTE)
                .OrderBy(u => u.Apellidos).ThenBy(u => u.Nombres)
                .Select(u => new DocenteDetalleDto(
                    u.Id, u.Dni, u.Nombres, u.Apellidos, u.Correo, u.Telefono, u.Estado
                ))
                .ToListAsync();
            return Results.Ok(docentes);
        }).WithName("GetDocentes");

        // ── GET /api/docentes/combo  → lista para selects
        group.MapGet("/combo", async (KumamotoDbContext db) =>
        {
            var list = await db.Usuarios
                .Where(u => u.RolId == ROL_DOCENTE && u.Estado == 1)
                .OrderBy(u => u.Apellidos)
                .Select(u => new { u.Id, NombreCompleto = $"{u.Nombres} {u.Apellidos}" })
                .ToListAsync();
            return Results.Ok(list);
        }).WithName("GetDocentesCombo");

        // ── POST /api/docentes  → crear con credenciales auto-generadas
        group.MapPost("/", async (CreateDocenteDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Dni) || dto.Dni.Length != 8)
                return Results.BadRequest(new { mensaje = "El DNI debe tener 8 dígitos." });
            if (string.IsNullOrWhiteSpace(dto.Nombres))
                return Results.BadRequest(new { mensaje = "Los nombres son requeridos." });
            if (string.IsNullOrWhiteSpace(dto.Apellidos))
                return Results.BadRequest(new { mensaje = "Los apellidos son requeridos." });

            var existeDni = await db.Usuarios.AnyAsync(u => u.Dni == dto.Dni);
            if (existeDni)
                return Results.Conflict(new { mensaje = "Ya existe un usuario con ese DNI." });

            var existeEstudiante = await db.Estudiantes.AnyAsync(e => e.Dni == dto.Dni);
            if (existeEstudiante)
                return Results.Conflict(new { mensaje = "El DNI ya está registrado como estudiante." });

            // Genera correo: [1ra letra nombre][primer apellido]@kumamoto.edu.pe
            var correo = await GenerarCorreoUnicoAsync(dto.Nombres.Trim(), dto.Apellidos.Trim(), db);
            var clave  = $"Kuma{dto.Dni}";

            var docente = new Usuario
            {
                Dni       = dto.Dni.Trim(),
                Nombres   = dto.Nombres.Trim(),
                Apellidos = dto.Apellidos.Trim(),
                Correo    = correo,
                Telefono  = dto.Telefono?.Trim(),
                ClaveHash = clave,
                RolId     = ROL_DOCENTE,
                Estado    = 1
            };
            db.Usuarios.Add(docente);
            await db.SaveChangesAsync();

            return Results.Created($"/api/docentes/{docente.Id}", new
            {
                docente.Id,
                correo,
                claveGenerada = clave,
                mensaje = $"Credenciales: correo={correo} | clave={clave}"
            });
        }).WithName("CreateDocente");


        // ── PUT /api/docentes/{id}  → editar datos
        group.MapPut("/{id:int}", async (int id, UpdateDocenteDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Nombres))
                return Results.BadRequest(new { mensaje = "El nombre es requerido." });

            var docente = await db.Usuarios.FindAsync(id);
            if (docente is null || docente.RolId != ROL_DOCENTE) return Results.NotFound();

            if (!string.IsNullOrWhiteSpace(dto.Correo))
            {
                var dup = await db.Usuarios.AnyAsync(u => u.Correo == dto.Correo && u.Id != id);
                if (dup) return Results.Conflict(new { mensaje = "Ese correo ya está en uso." });
            }

            docente.Nombres = dto.Nombres.Trim();
            docente.Apellidos = dto.Apellidos?.Trim() ?? docente.Apellidos;
            docente.Correo = string.IsNullOrWhiteSpace(dto.Correo) ? docente.Correo : dto.Correo.Trim();
            docente.Telefono = dto.Telefono?.Trim();
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("UpdateDocente");

        // ── PATCH /api/docentes/{id}/clave  → cambiar contraseña
        group.MapPatch("/{id:int}/clave", async (int id, CambiarClaveDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.NuevaClave) || dto.NuevaClave.Length < 4)
                return Results.BadRequest(new { mensaje = "La contraseña debe tener al menos 4 caracteres." });

            var docente = await db.Usuarios.FindAsync(id);
            if (docente is null || docente.RolId != ROL_DOCENTE) return Results.NotFound();

            docente.ClaveHash = dto.NuevaClave.Trim();
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("CambiarClaveDocente");

        // ── PATCH /api/docentes/{id}/estado  → toggle activo/inactivo
        group.MapPatch("/{id:int}/estado", async (int id, KumamotoDbContext db) =>
        {
            var d = await db.Usuarios.FindAsync(id);
            if (d is null || d.RolId != ROL_DOCENTE) return Results.NotFound();
            d.Estado = d.Estado == 1 ? (short)0 : (short)1;
            await db.SaveChangesAsync();
            return Results.Ok(new { d.Estado });
        }).WithName("ToggleDocenteEstado");

        // ── DELETE /api/docentes/{id}  → eliminación lógica
        group.MapDelete("/{id:int}", async (int id, KumamotoDbContext db) =>
        {
            var d = await db.Usuarios.FindAsync(id);
            if (d is null || d.RolId != ROL_DOCENTE) return Results.NotFound();
            d.Estado = 0;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("DeleteDocente");

        // ── PORTAL DOCENTE ──────────────────────────────────────────────────
        
        // GET /api/docentes/portal/clase-actual
        group.MapGet("/portal/clase-actual", async (System.Security.Claims.ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userIdStr = user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                          ?? user.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdStr, out var userId)) return Results.Unauthorized();

            var now = DateTime.Now;
            var diaSpanish = GetDiaSemanaSpanish(now.DayOfWeek);
            var horaActual = TimeOnly.FromDateTime(now);

            Console.WriteLine($"[DocentePortal] Buscando clase activa: userId={userId}, dia={diaSpanish}, hora={horaActual}");

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

            // FALLBACK PARA DESARROLLO: Si no hay clase ahora mismo, tomar la primera clase que encuentre del docente (cualquier día)
            if (horarioActivo == null)
            {
                Console.WriteLine($"[DocentePortal] No hay clase exacta. Buscando cualquier carga del docente {userId}...");
                horarioActivo = await db.HorarioDetalle
                    .Include(h => h.Carga).ThenInclude(c => c!.Curso)
                    .Include(h => h.Carga).ThenInclude(c => c!.Aula).ThenInclude(a => a!.Grado)
                    .Include(h => h.Carga).ThenInclude(c => c!.Aula).ThenInclude(a => a!.Seccion)
                    .Where(h => h.Carga!.DocenteId == userId && h.Estado == 1)
                    .OrderBy(h => h.Id)
                    .FirstOrDefaultAsync();
            }

            if (horarioActivo?.Carga == null)
            {
                Console.WriteLine($"[DocentePortal] Error: No se encontró NINGUNA carga para el docente {userId}");
                return Results.Ok(new { activa = false, mensaje = "No tienes clases programadas en el sistema para tu usuario." });
            }

            Console.WriteLine($"[DocentePortal] Clase encontrada: {horarioActivo.Carga.Curso?.Nombre} en {horarioActivo.Carga.Aula?.Grado?.Nombre}");

            var carga = horarioActivo.Carga;
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

        // POST /api/docentes/portal/registrar-asistencia
        group.MapPost("/portal/registrar-asistencia", async (AsistenciaDocenteRequest request, System.Security.Claims.ClaimsPrincipal user, KumamotoDbContext db, Kumamoto.API.Services.EarlyWarningService earlyWarning) =>
        {
            var userIdStr = user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                          ?? user.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdStr, out var userId)) return Results.Unauthorized();

            if (request.Estudiantes == null || !request.Estudiantes.Any())
                return Results.BadRequest(new { mensaje = "Debe marcar la asistencia." });

            var hoy = DateOnly.FromDateTime(DateTime.Now);

            foreach (var item in request.Estudiantes)
            {
                db.Asistencias.Add(new Asistencia
                {
                    EstudianteId = item.EstudianteId,
                    RegistradoPorId = userId,
                    CargaAcademicaId = request.CargaId,
                    Fecha = hoy,
                    Valor = item.Presente ? "P" : "F",
                    Estado = 1
                });
            }

            await db.SaveChangesAsync();

            foreach (var item in request.Estudiantes)
                await earlyWarning.RecalcularRiesgoAcademico(item.EstudianteId);

            return Results.Ok(new { mensaje = "Asistencia registrada." });
        }).WithName("RegistrarAsistenciaDocente");
    }

    private static string GetDiaSemanaSpanish(DayOfWeek day) => day switch
    {
        DayOfWeek.Monday => "Lunes", DayOfWeek.Tuesday => "Martes", DayOfWeek.Wednesday => "Miércoles",
        DayOfWeek.Thursday => "Jueves", DayOfWeek.Friday => "Viernes", DayOfWeek.Saturday => "Sábado",
        DayOfWeek.Sunday => "Domingo", _ => ""
    };

    public record AsistenciaDocenteRequest(int CargaId, List<EstudianteAsistenciaItem> Estudiantes);
    public record EstudianteAsistenciaItem(int EstudianteId, bool Presente);


    // ── Helper: genera correo único [letraNombre][apellido]@kumamoto.edu.pe ──
    private static async Task<string> GenerarCorreoUnicoAsync(
        string nombres, string apellidos, KumamotoDbContext db)
    {
        var letraNombre  = NormalizarTexto(nombres.Split(' ')[0])[0].ToString();
        var primerApellido = NormalizarTexto(apellidos.Split(' ')[0]);
        var baseLocal    = $"{letraNombre}{primerApellido}";
        var dominio      = "@kumamoto.edu.pe";

        var candidato = $"{baseLocal}{dominio}";
        if (!await db.Usuarios.AnyAsync(u => u.Correo == candidato))
            return candidato;

        // Sufijo numérico para duplicados: cmendoza2, cmendoza3...
        for (int i = 2; i <= 999; i++)
        {
            candidato = $"{baseLocal}{i}{dominio}";
            if (!await db.Usuarios.AnyAsync(u => u.Correo == candidato))
                return candidato;
        }
        // Fallback muy improbable
        return $"{baseLocal}{Guid.NewGuid().ToString()[..4]}{dominio}";
    }

    // ── Helper: quita tildes y caracteres especiales, pasa a minúsculas ──
    private static string NormalizarTexto(string texto)
    {
        var normalizado = texto
            .Normalize(System.Text.NormalizationForm.FormD);
        var sb = new System.Text.StringBuilder();
        foreach (var c in normalizado)
        {
            var cat = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
            if (cat != System.Globalization.UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }
        return sb.ToString()
                 .Normalize(System.Text.NormalizationForm.FormC)
                 .ToLower()
                 .Replace("ñ", "n");
    }
}
