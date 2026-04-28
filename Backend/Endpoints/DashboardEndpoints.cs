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
            var totalAlumnos = await db.Estudiantes.CountAsync(e => e.Estado == 1);
            
            // Asistencia de hoy
            var hoy = DateOnly.FromDateTime(DateTime.Today);
            var totalAsistenciasHoy = await db.Asistencias
                .CountAsync(a => a.Fecha == hoy && a.Estado == 1);
            var presentesHoy = await db.Asistencias
                .CountAsync(a => a.Fecha == hoy && a.Valor == "P" && a.Estado == 1);

            double porcentajeAsistencia = totalAsistenciasHoy > 0 
                ? Math.Round((double)presentesHoy / totalAsistenciasHoy * 100, 1) 
                : 100.0; // Si no hay registros asumimos 100% o 0% dependiendo de la regla de negocio, ponemos 100 para demo

            // Riesgos
            var riesgoMedio = await db.AlertasRiesgo
                .CountAsync(a => a.NivelRiesgo == "Medio" && a.Estado == 1);
            var riesgoAlto = await db.AlertasRiesgo
                .CountAsync(a => a.NivelRiesgo == "Alto" && a.Estado == 1);

            return Results.Ok(new
            {
                TotalAlumnos = totalAlumnos,
                AsistenciaHoy = porcentajeAsistencia,
                RiesgoMedio = riesgoMedio,
                RiesgoAlto = riesgoAlto
            });
        })
        .WithName("GetDashboardKpis")
        .WithSummary("Obtiene los KPIs principales del dashboard");
    }
}
