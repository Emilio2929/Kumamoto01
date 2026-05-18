using System.Security.Claims;
using Kumamoto.API.Data;
using Kumamoto.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Endpoints;

public static class NotificacionesEndpoints
{
    public static void MapNotificacionesEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/notificaciones").WithTags("Notificaciones").RequireAuthorization();

        // GET /api/notificaciones/me -> Obtener las notificaciones del usuario autenticado (Padre, Docente, etc.)
        group.MapGet("/me", async (ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdStr, out var userId)) return Results.Unauthorized();

            var notificaciones = await db.Notificaciones
                .Include(n => n.Remitente).ThenInclude(r => r!.Rol)
                .Include(n => n.Estudiante)
                .Where(n => n.UsuarioDestinoId == userId && n.Estado == 1)
                .OrderByDescending(n => n.FechaEnvio)
                .Select(n => new
                {
                    n.Id,
                    n.Tipo,
                    n.Titulo,
                    n.Mensaje,
                    n.FechaEnvio,
                    n.Leido,
                    Remitente = n.Remitente != null ? $"{n.Remitente.Nombres} {n.Remitente.Apellidos}" : "Administración",
                    RolRemitente = n.Remitente != null && n.Remitente.Rol != null ? n.Remitente.Rol.Nombre : "Directivo",
                    Estudiante = n.Estudiante != null ? $"{n.Estudiante.Nombres} {n.Estudiante.Apellidos}" : null,
                    n.EstudianteId
                })
                .ToListAsync();

            return Results.Ok(notificaciones);
        });

        // GET /api/notificaciones/noread/count -> Obtener cantidad de no leídas
        group.MapGet("/noread/count", async (ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdStr, out var userId)) return Results.Unauthorized();

            var count = await db.Notificaciones
                .Where(n => n.UsuarioDestinoId == userId && n.Leido == 0 && n.Estado == 1)
                .CountAsync();

            return Results.Ok(new { count });
        });

        // PATCH /api/notificaciones/{id}/leer -> Marcar una notificación como leída
        group.MapPatch("/{id:int}/leer", async (int id, ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdStr, out var userId)) return Results.Unauthorized();

            var notificacion = await db.Notificaciones.FirstOrDefaultAsync(n => n.Id == id && n.UsuarioDestinoId == userId);
            if (notificacion == null) return Results.NotFound(new { mensaje = "Notificación no encontrada." });

            notificacion.Leido = 1;
            await db.SaveChangesAsync();

            return Results.Ok(new { mensaje = "Notificación marcada como leída.", id });
        });

        // PATCH /api/notificaciones/leer-todas -> Marcar todas como leídas
        group.MapPatch("/leer-todas", async (ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdStr, out var userId)) return Results.Unauthorized();

            var noLeidas = await db.Notificaciones
                .Where(n => n.UsuarioDestinoId == userId && n.Leido == 0 && n.Estado == 1)
                .ToListAsync();

            foreach (var n in noLeidas)
            {
                n.Leido = 1;
            }

            await db.SaveChangesAsync();
            return Results.Ok(new { mensaje = "Todas las notificaciones marcadas como leídas.", count = noLeidas.Count });
        });

        // POST /api/notificaciones -> Enviar una notificación (Directora, Auxiliar, Docente)
        group.MapPost("/", async (CreateNotificacionDto dto, ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdStr, out var remitenteId)) return Results.Unauthorized();

            if (string.IsNullOrWhiteSpace(dto.Titulo) || string.IsNullOrWhiteSpace(dto.Mensaje))
                return Results.BadRequest(new { mensaje = "El título y el mensaje son obligatorios." });

            var notificacion = new Notificacion
            {
                UsuarioDestinoId = dto.UsuarioDestinoId,
                EstudianteId = dto.EstudianteId,
                RemitenteId = remitenteId,
                Tipo = string.IsNullOrWhiteSpace(dto.Tipo) ? "General" : dto.Tipo.Trim(),
                Titulo = dto.Titulo.Trim(),
                Mensaje = dto.Mensaje.Trim(),
                FechaEnvio = DateTime.UtcNow,
                Leido = 0,
                Estado = 1
            };

            db.Notificaciones.Add(notificacion);
            await db.SaveChangesAsync();

            return Results.Created($"/api/notificaciones/{notificacion.Id}", new { mensaje = "Notificación enviada exitosamente.", id = notificacion.Id });
        });
    }
}

public record CreateNotificacionDto(int UsuarioDestinoId, int? EstudianteId, string Tipo, string Titulo, string Mensaje);
