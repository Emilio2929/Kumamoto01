using Kumamoto.API.Data;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Services;

public class RiesgoService
{
    public async Task RecalcularVariableDependiente1PorAulaAsync(
        int aulaId,
        DateOnly fecha,
        KumamotoDbContext db)
    {
        // Hook mínimo para no bloquear el flujo.
        // Aquí se implementará el motor real (alerta temprana) cuando esté definido.
        var estudiantesIds = await db.Estudiantes
            .Where(e => e.AulaId == aulaId && e.Estado == 1)
            .Select(e => e.Id)
            .ToListAsync();

        Console.WriteLine($"[RiesgoService] Recalculo VD1 aula={aulaId} fecha={fecha} estudiantes={estudiantesIds.Count}");
    }
}

