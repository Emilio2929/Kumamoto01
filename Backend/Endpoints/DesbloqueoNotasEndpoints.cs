using Kumamoto.API.Data;
using Kumamoto.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Kumamoto.API.Endpoints;

public static class DesbloqueoNotasEndpoints
{
    public static void MapDesbloqueoNotasEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/desbloqueo-notas").WithTags("DesbloqueoNotas").RequireAuthorization();

        // ── POST /api/desbloqueo-notas
        group.MapPost("/", async (CrearDesbloqueoRequest request, ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdStr, out var userId)) return Results.Unauthorized();

            // Solo Directora o rol autorizado (ej: rolId = 1)
            var usuario = await db.Usuarios.FindAsync(userId);
            if (usuario == null || usuario.RolId != 1) return Results.Forbid();

            var carga = await db.CargasAcademicas.FindAsync(request.CargaId);
            if (carga == null) return Results.BadRequest("Carga no encontrada.");

            var semana = await db.SemanaAcademicas.FindAsync(request.SemanaId);
            if (semana == null) return Results.BadRequest("Semana no encontrada.");

            var estudiante = await db.Estudiantes.FindAsync(request.EstudianteId);
            if (estudiante == null) return Results.BadRequest("Estudiante no encontrado.");

            var ahora = DateTime.UtcNow;

            // Inactivar desbloqueos previos
            var previos = await db.DesbloqueosCalificacion
                .Where(d => d.CargaId == request.CargaId && d.SemanaId == request.SemanaId && d.EstudianteId == request.EstudianteId && d.Estado == 1)
                .ToListAsync();
            foreach (var p in previos) p.Estado = 0;

            var nuevo = new DesbloqueoCalificacion
            {
                CargaId = request.CargaId,
                SemanaId = request.SemanaId,
                EstudianteId = request.EstudianteId,
                HabilitadoPorId = userId,
                FechaAutorizacion = ahora,
                FechaExpiracion = ahora.AddHours(24), // Valido por 24 horas
                Estado = 1
            };

            db.DesbloqueosCalificacion.Add(nuevo);
            await db.SaveChangesAsync();

            return Results.Ok(new { mensaje = "Permiso concedido exitosamente por 24 horas." });
        });

        // ── GET /api/desbloqueo-notas/activos
        group.MapGet("/activos", async (ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdStr, out var userId)) return Results.Unauthorized();

            var usuario = await db.Usuarios.FindAsync(userId);
            if (usuario == null || usuario.RolId != 1) return Results.Forbid();

            var ahora = DateTime.UtcNow;

            var activos = await db.DesbloqueosCalificacion
                .Include(d => d.Carga!).ThenInclude(c => c.Curso)
                .Include(d => d.Carga!).ThenInclude(c => c.Aula!).ThenInclude(a => a.Grado)
                .Include(d => d.Carga!).ThenInclude(c => c.Aula!).ThenInclude(a => a.Seccion)
                .Include(d => d.Estudiante)
                .Include(d => d.Semana)
                .Where(d => d.Estado == 1 && d.FechaExpiracion > ahora)
                .Select(d => new
                {
                    d.Id,
                    Curso = d.Carga!.Curso!.Nombre,
                    Aula = $"{d.Carga.Aula!.Grado!.Nombre} {d.Carga.Aula.Seccion!.Letra}",
                    Estudiante = $"{d.Estudiante!.Apellidos}, {d.Estudiante.Nombres}",
                    Semana = d.Semana!.NumeroSemana,
                    FechaExpiracion = d.FechaExpiracion
                })
                .ToListAsync();

            return Results.Ok(activos);
        });
        
        // ── POST /api/desbloqueo-notas/{id}/revocar
        group.MapPost("/{id}/revocar", async (int id, ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdStr, out var userId)) return Results.Unauthorized();

            var usuario = await db.Usuarios.FindAsync(userId);
            if (usuario == null || usuario.RolId != 1) return Results.Forbid();

            var desbloqueo = await db.DesbloqueosCalificacion.FindAsync(id);
            if (desbloqueo == null) return Results.NotFound();

            desbloqueo.Estado = 0;
            await db.SaveChangesAsync();

            return Results.Ok(new { mensaje = "Permiso revocado exitosamente." });
        });
    }
}

public class CrearDesbloqueoRequest
{
    public int CargaId { get; set; }
    public int SemanaId { get; set; }
    public int EstudianteId { get; set; }
}
