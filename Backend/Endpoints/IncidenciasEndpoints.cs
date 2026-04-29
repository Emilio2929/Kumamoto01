using System.Security.Claims;
using Kumamoto.API.Data;
using Kumamoto.API.DTOs;
using Kumamoto.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Endpoints;

public static class IncidenciasEndpoints
{
    public static void MapIncidenciasEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/incidencias")
            .WithTags("Incidencias")
            .RequireAuthorization();

        // POST /api/incidencias
        group.MapPost("/", async (CrearIncidenciaRequest req, ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var claim = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
            if (!int.TryParse(claim, out var userId)) return Results.Unauthorized();

            if (req.EstudianteId <= 0) return Results.BadRequest(new { mensaje = "EstudianteId inválido." });
            if (string.IsNullOrWhiteSpace(req.TipoIncidencia)) return Results.BadRequest(new { mensaje = "TipoIncidencia es requerido." });

            var existe = await db.Estudiantes.AnyAsync(e => e.Id == req.EstudianteId && e.Estado == 1);
            if (!existe) return Results.BadRequest(new { mensaje = "El estudiante no existe." });

            var incidencia = new Incidencia
            {
                EstudianteId = req.EstudianteId,
                RegistradoPorId = userId,
                TipoIncidencia = req.TipoIncidencia.Trim(),
                Descripcion = req.Descripcion?.Trim(),
                FechaRegistro = DateTime.UtcNow,
                Estado = 1
            };

            db.Incidencias.Add(incidencia);
            await db.SaveChangesAsync();

            return Results.Created($"/api/incidencias/{incidencia.Id}", new { incidencia.Id });
        })
        .WithName("CrearIncidencia");
    }
}

