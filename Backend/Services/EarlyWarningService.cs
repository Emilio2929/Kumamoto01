using Kumamoto.API.Data;
using Kumamoto.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Services;

public class EarlyWarningService(KumamotoDbContext db)
{
    public async Task RecalcularRiesgoAcademico(int estudianteId)
    {
        // 1. Obtener total de asistencias tomadas para este estudiante
        var totalSesiones = await db.Asistencias.CountAsync(a => a.EstudianteId == estudianteId && a.Estado == 1);
        if (totalSesiones == 0) return;

        // 2. Calcular peso de inasistencias
        // Regla: Falta (F) = 1.0, Tardanza (T) = 0.5
        var faltas = await db.Asistencias.CountAsync(a => a.EstudianteId == estudianteId && a.Valor == "F" && a.Estado == 1);
        var tardanzas = await db.Asistencias.CountAsync(a => a.EstudianteId == estudianteId && a.Valor == "T" && a.Estado == 1);

        double ratioInasistencia = (double)(faltas + (tardanzas * 0.5)) / totalSesiones;

        string? nivelRiesgo = null;
        string motivo = "";

        if (ratioInasistencia >= 0.25) // 25% o más de inasistencia acumulada
        {
            nivelRiesgo = "Alto";
            motivo = $"Inasistencia Crítica: {faltas} faltas y {tardanzas} tardanzas ({ratioInasistencia:P0} de inasistencia).";
        }
        else if (ratioInasistencia >= 0.15) // 15% a 25%
        {
            nivelRiesgo = "Medio";
            motivo = $"Inasistencia Regular: {faltas} faltas y {tardanzas} tardanzas ({ratioInasistencia:P0} de inasistencia).";
        }

        if (nivelRiesgo != null)
        {
            // Desactivar alertas anteriores para este estudiante
            var alertasViejas = await db.AlertasRiesgo
                .Where(a => a.EstudianteId == estudianteId && a.Estado == 1)
                .ToListAsync();
            
            foreach (var av in alertasViejas) av.Estado = 0;

            // Registrar nueva alerta
            var alerta = new AlertaRiesgo
            {
                EstudianteId = estudianteId,
                NivelRiesgo = nivelRiesgo,
                Motivo = motivo,
                Estado = 1
            };
            db.AlertasRiesgo.Add(alerta);
            await db.SaveChangesAsync();
        }
    }
}
