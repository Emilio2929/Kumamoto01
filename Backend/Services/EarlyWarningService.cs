using Kumamoto.API.Data;
using Kumamoto.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Services;

public class EarlyWarningService(KumamotoDbContext db)
{
    public async Task RecalcularRiesgoAcademico(int estudianteId)
    {
        // 1 SOLA query con agregación — evita 3 roundtrips a Supabase
        var stats = await db.Asistencias
            .Where(a => a.EstudianteId == estudianteId && a.Estado == 1)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Total    = g.Count(),
                Faltas   = g.Count(a => a.Valor == "F"),
                Tardanzas = g.Count(a => a.Valor == "T")
            })
            .FirstOrDefaultAsync();

        if (stats == null || stats.Total == 0) return;

        double ratioInasistencia = (double)(stats.Faltas + (stats.Tardanzas * 0.5)) / stats.Total;

        string? nivelRiesgo = null;
        string motivo = "";

        if (ratioInasistencia >= 0.25)
        {
            nivelRiesgo = "Alto";
            motivo = $"Inasistencia Crítica: {stats.Faltas} faltas y {stats.Tardanzas} tardanzas ({ratioInasistencia:P0} de inasistencia).";
        }
        else if (ratioInasistencia >= 0.15)
        {
            nivelRiesgo = "Medio";
            motivo = $"Inasistencia Regular: {stats.Faltas} faltas y {stats.Tardanzas} tardanzas ({ratioInasistencia:P0} de inasistencia).";
        }

        if (nivelRiesgo != null)
        {
            // Desactivar alertas anteriores y registrar la nueva — 1 SaveChanges
            var alertasViejas = await db.AlertasRiesgo
                .Where(a => a.EstudianteId == estudianteId && a.Estado == 1)
                .ToListAsync();

            foreach (var av in alertasViejas) av.Estado = 0;

            db.AlertasRiesgo.Add(new AlertaRiesgo
            {
                EstudianteId = estudianteId,
                NivelRiesgo  = nivelRiesgo,
                Motivo       = motivo,
                Estado       = 1
            });
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
