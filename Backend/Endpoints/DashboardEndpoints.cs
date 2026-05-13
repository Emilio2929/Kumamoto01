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
    }
}
