using Kumamoto.API.Data;
using Kumamoto.API.DTOs;
using Kumamoto.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Endpoints;

public static class AsignacionAuxiliarEndpoints
{
    private const int ROL_AUXILIAR = 3;

    public static void MapAsignacionAuxiliarEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/asignacion-auxiliar").WithTags("Asignacion Auxiliar").RequireAuthorization();

        // GET /api/asignacion-auxiliar/grouped → Auxiliares con sus aulas agrupadas
        group.MapGet("/grouped", async (KumamotoDbContext db) =>
        {
            var asignaciones = await db.AsignacionesAuxiliar
                .Include(a => a.Auxiliar)
                .Include(a => a.Aula).ThenInclude(au => au!.Grado)
                .Include(a => a.Aula).ThenInclude(au => au!.Seccion)
                .Where(a => a.Estado == 1)
                .ToListAsync();

            var agrupado = asignaciones
                .GroupBy(a => new { a.AuxiliarId, a.Auxiliar!.Nombres, a.Auxiliar.Apellidos })
                .Select(g => new AuxiliarAsignacionesGroupDto(
                    g.Key.AuxiliarId,
                    $"{g.Key.Nombres} {g.Key.Apellidos}",
                    g.Select(a => new AulaAsignadaDetalleDto(
                        a.Id,
                        a.AulaId,
                        a.Aula!.Grado!.Nombre,
                        a.Aula.Seccion!.Letra,
                        a.Aula.Descripcion,
                        a.PeriodoLectivo
                    )).OrderBy(x => x.GradoNombre).ThenBy(x => x.SeccionLetra).ToList()
                ))
                .OrderBy(x => x.AuxiliarNombre)
                .ToList();

            return Results.Ok(agrupado);
        }).WithName("GetAsignacionesAuxiliarGrouped");

        // POST /api/asignacion-auxiliar/bulk → Asignar múltiples aulas a un auxiliar
        group.MapPost("/bulk", async (BulkAsignarAuxiliarDto dto, KumamotoDbContext db) =>
        {
            if (dto.AulaIds == null || !dto.AulaIds.Any())
                return Results.BadRequest(new { mensaje = "Debe seleccionar al menos un aula." });

            var auxiliar = await db.Usuarios.FindAsync(dto.AuxiliarId);
            if (auxiliar is null || auxiliar.RolId != ROL_AUXILIAR)
                return Results.BadRequest(new { mensaje = "Auxiliar inválido." });

            foreach (var aulaId in dto.AulaIds)
            {
                var existe = await db.AsignacionesAuxiliar.AnyAsync(a =>
                    a.AuxiliarId == dto.AuxiliarId && a.AulaId == aulaId && a.PeriodoLectivo == dto.PeriodoLectivo && a.Estado == 1);
                
                if (!existe)
                {
                    db.AsignacionesAuxiliar.Add(new AsignacionAuxiliar
                    {
                        AuxiliarId = dto.AuxiliarId,
                        AulaId = aulaId,
                        PeriodoLectivo = dto.PeriodoLectivo,
                        Estado = 1
                    });
                }
            }

            await db.SaveChangesAsync();
            return Results.Ok(new { mensaje = "Asignaciones procesadas correctamente." });
        }).WithName("BulkAsignarAuxiliar");

        // DELETE /api/asignacion-auxiliar/{id} → Eliminar una asignación específica
        group.MapDelete("/{id:int}", async (int id, KumamotoDbContext db) =>
        {
            var asignacion = await db.AsignacionesAuxiliar.FindAsync(id);
            if (asignacion is null) return Results.NotFound();

            db.AsignacionesAuxiliar.Remove(asignacion); // Eliminación física para limpieza de múltiples aulas
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("DeleteAsignacionAuxiliar");

        // Los otros endpoints se mantienen si son necesarios, pero el flujo principal será Bulk y Grouped
    }
}
