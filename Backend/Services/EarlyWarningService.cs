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

    public async Task RecalcularRiesgoAcademicoPorNota(int estudianteId)
    {
        // Obtener calificaciones vigentes (Estado = 1) del estudiante
        var calificaciones = await db.Calificaciones
            .Include(c => c.Competencia)
            .Include(c => c.Escala)
            .Where(c => c.EstudianteId == estudianteId && c.Estado == 1)
            .ToListAsync();

        if (calificaciones.Count == 0) return;

        // Contar notas 'C' (Riesgo)
        int notasBajas = calificaciones.Count(c => c.Escala?.Letra == "C" || c.Escala?.RequiereIntervencion == true);

        string? nivelRiesgo = null;
        string motivo = "";

        if (notasBajas >= 3)
        {
            nivelRiesgo = "Alto";
            motivo = $"Riesgo Académico Crítico: {notasBajas} competencias con nota 'C'.";
        }
        else if (notasBajas >= 1)
        {
            nivelRiesgo = "Medio";
            motivo = $"Riesgo Académico Moderado: {notasBajas} competencias con nota 'C'.";
        }

        if (nivelRiesgo != null)
        {
            // Desactivar alertas ACADÉMICAS anteriores para este estudiante
            // Ojo: asumimos que las alertas de asistencia tienen 'Inasistencia' en el motivo.
            // Para ser más robusto, se podría agregar un TipoAlerta a la tabla. Por ahora, filtramos por motivo.
            var alertasViejas = await db.AlertasRiesgo
                .Where(a => a.EstudianteId == estudianteId && a.Estado == 1 && a.Motivo != null && a.Motivo.Contains("Académico"))
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
