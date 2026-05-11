using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kumamoto.API.Models;

[Table("calificacion_bimestral")]
public class CalificacionBimestral
{
    [Column("id")]
    public int Id { get; set; }

    [Column("estudiante_id")]
    public int EstudianteId { get; set; }
    public Estudiante? Estudiante { get; set; }

    [Column("competencia_id")]
    public int CompetenciaId { get; set; }
    public Competencia? Competencia { get; set; }

    [Column("periodo_id")]
    public int PeriodoId { get; set; }
    public PeriodoAcademico? Periodo { get; set; }

    [Column("escala_id")]
    public int EscalaId { get; set; }
    public EscalaCalificacion? Escala { get; set; }

    [Column("fecha_registro")]
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    [Column("estado")]
    public short Estado { get; set; } = 1;
}
