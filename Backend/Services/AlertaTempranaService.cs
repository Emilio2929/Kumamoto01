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
        var estudiante = await _db.Estudiantes
            .Include(e => e.Aula)
            .FirstOrDefaultAsync(e => e.Id == estudianteId && e.Estado == 1);

        if (estudiante == null) return;

        // 1. Obtener Periodo Actual (Bimestre)
        var hoy = DateOnly.FromDateTime(DateTime.Today);
        var periodo = await _db.PeriodosAcademicos
            .FirstOrDefaultAsync(p => p.FechaInicio <= hoy && p.FechaFin >= hoy && p.Estado == 1);

        if (periodo == null) return;

        // 2. Cálculo de Asistencia
        var totalSesiones = await _db.HorarioDetalle
            .CountAsync(h => h.Carga!.AulaId == estudiante.AulaId && h.Estado == 1);
        
        // Asumimos que queremos el % del bimestre actual
        var asistencias = await _db.Asistencias
            .Where(a => a.EstudianteId == estudianteId && a.Fecha >= periodo.FechaInicio && a.Fecha <= periodo.FechaFin && a.Estado == 1)
            .ToListAsync();

        var inasistencias = asistencias.Count(a => a.Valor == "F");
        var totalRegistradas = asistencias.Count;
        double pctInasistencia = totalRegistradas > 0 ? (double)inasistencias / totalRegistradas * 100 : 0;

        // 3. Cálculo de Notas (Bimestrales o actuales)
        // Buscamos competencias con notas bajas
        var notasBajas = await (from c in _db.Calificaciones
                               join esc in _db.EscalaCalificaciones on c.EscalaId equals esc.Id
                               where c.EstudianteId == estudianteId 
                                     && c.Estado == 1
                               select new { esc.Letra, esc.RequiereIntervencion })
                               .ToListAsync();

        int competenciasConC = notasBajas.Count(n => n.Letra == "C" || n.RequiereIntervencion);
        int competenciasConB = notasBajas.Count(n => n.Letra == "B");

        // 4. Determinar Nivel de Riesgo
        string nivel = "Bajo";
        string motivo = "Estudiante con asistencia regular y buen rendimiento.";
        string recomendacion = "Felicitaciones, mantenga el ritmo académico actual.";

        if (pctInasistencia > 20 || competenciasConC > 0)
        {
            nivel = "Alto";
            motivo = pctInasistencia > 20 
                ? $"Inasistencia crítica ({pctInasistencia:F1}%)." 
                : $"Rendimiento insuficiente (Promedio C en competencias).";
            recomendacion = "Atención Urgente: Se requiere citación inmediata con el padre de familia y tutor.";
        }
        else if (pctInasistencia >= 10 || competenciasConB >= 2)
        {
            nivel = "Medio";
            motivo = pctInasistencia >= 10 
                ? $"Inasistencia moderada ({pctInasistencia:F1}%)." 
                : $"Rendimiento en observación (Múltiples notas B).";
            recomendacion = "Atención Preventiva: Se recomienda reforzamiento académico y seguimiento de asistencia.";
        }

        // 5. Persistir Resultado
        var riesgoExistente = await _db.AlumnosRiesgo
            .FirstOrDefaultAsync(r => r.EstudianteId == estudianteId && r.Bimestre == periodo.Id && r.Estado == 1);

        if (riesgoExistente != null)
        {
            riesgoExistente.NivelRiesgo = nivel;
            riesgoExistente.Motivo = motivo;
            riesgoExistente.Recomendacion = recomendacion;
            riesgoExistente.FechaCalculo = DateTime.UtcNow;
        }
        else
        {
            _db.AlumnosRiesgo.Add(new AlumnoRiesgo
            {
                EstudianteId = estudianteId,
                NivelRiesgo = nivel,
                Motivo = motivo,
                Recomendacion = recomendacion,
                Bimestre = periodo.Id,
                FechaCalculo = DateTime.UtcNow,
                Estado = 1
            });
        }

        await _db.SaveChangesAsync();
    }
}
