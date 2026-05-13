using Kumamoto.API.Data;
using Kumamoto.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Services;

public class AlertaTempranaService
{
    private readonly KumamotoDbContext _db;

    public AlertaTempranaService(KumamotoDbContext db)
    {
        _db = db;
    }

    public async Task RecalcularRiesgoAcademico(int estudianteId)
    {
        var hoy = DateOnly.FromDateTime(DateTime.Today);

        // DbContext NO es thread-safe: queries secuenciales con GroupBy
        var estudiante = await _db.Estudiantes
            .AsNoTracking()
            .Select(e => new { e.Id, e.AulaId, e.Estado })
            .FirstOrDefaultAsync(e => e.Id == estudianteId && e.Estado == 1);

        if (estudiante == null) return;

        var periodo = await _db.PeriodosAcademicos
            .AsNoTracking()
            .Select(p => new { p.Id, p.FechaInicio, p.FechaFin, p.Estado })
            .FirstOrDefaultAsync(p => p.FechaInicio <= hoy && p.FechaFin >= hoy && p.Estado == 1);

        if (periodo == null) return;

        // Asistencia: 1 query GroupBy en vez de cargar todos los registros en memoria
        var asist = await _db.Asistencias
            .Where(a => a.EstudianteId == estudianteId
                     && a.Fecha >= periodo.FechaInicio
                     && a.Fecha <= periodo.FechaFin
                     && a.Estado == 1)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Total         = g.Count(),
                Inasistencias = g.Count(a => a.Valor == "F")
            })
            .FirstOrDefaultAsync();

        // Notas: join en BD, no en memoria
        var notasBajas = await (from c in _db.Calificaciones
                                join esc in _db.EscalaCalificaciones on c.EscalaId equals esc.Id
                                where c.EstudianteId == estudianteId && c.Estado == 1
                                select new { esc.Letra, esc.RequiereIntervencion })
                               .ToListAsync();

        double pctInasistencia = asist is { Total: > 0 }
            ? (double)asist.Inasistencias / asist.Total * 100
            : 0;

        int competenciasConC = notasBajas.Count(n => n.Letra == "C" || n.RequiereIntervencion);
        int competenciasConB = notasBajas.Count(n => n.Letra == "B");

        // Determinar Nivel de Riesgo
        string nivel         = "Bajo";
        string motivo        = "Estudiante con asistencia regular y buen rendimiento.";
        string recomendacion = "Felicitaciones, mantenga el ritmo académico actual.";

        if (pctInasistencia > 20 || competenciasConC > 0)
        {
            nivel  = "Alto";
            motivo = pctInasistencia > 20
                ? $"Inasistencia crítica ({pctInasistencia:F1}%)."
                : $"Rendimiento insuficiente (Promedio C en competencias).";
            recomendacion = "Atención Urgente: Se requiere citación inmediata con el padre de familia y tutor.";
        }
        else if (pctInasistencia >= 10 || competenciasConB >= 2)
        {
            nivel  = "Medio";
            motivo = pctInasistencia >= 10
                ? $"Inasistencia moderada ({pctInasistencia:F1}%)."
                : $"Rendimiento en observación (Múltiples notas B).";
            recomendacion = "Atención Preventiva: Se recomienda reforzamiento académico y seguimiento de asistencia.";
        }

        // Persistir: upsert
        var riesgoExistente = await _db.AlumnosRiesgo
            .FirstOrDefaultAsync(r => r.EstudianteId == estudianteId && r.Bimestre == periodo.Id && r.Estado == 1);

        if (riesgoExistente != null)
        {
            riesgoExistente.NivelRiesgo   = nivel;
            riesgoExistente.Motivo        = motivo;
            riesgoExistente.Recomendacion = recomendacion;
            riesgoExistente.FechaCalculo  = DateTime.UtcNow;
        }
        else
        {
            _db.AlumnosRiesgo.Add(new AlumnoRiesgo
            {
                EstudianteId  = estudianteId,
                NivelRiesgo   = nivel,
                Motivo        = motivo,
                Recomendacion = recomendacion,
                Bimestre      = periodo.Id,
                FechaCalculo  = DateTime.UtcNow,
                Estado        = 1
            });
        }

        await _db.SaveChangesAsync();
    }
}
