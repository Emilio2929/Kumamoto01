using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kumamoto.API.Models;

public class Calificacion
{
    public int Id { get; set; }
    public int? EstudianteId { get; set; }
    public Estudiante? Estudiante { get; set; }
    [Column("competencia_id")]
    public int? CompetenciaId { get; set; }
    public Competencia? Competencia { get; set; }

    [Column("semana_id")]
    public int SemanaId { get; set; }
    public SemanaAcademica? Semana { get; set; }

    [Column("escala_id")]
    public int EscalaId { get; set; }
    public EscalaCalificacion? Escala { get; set; }

    [Column("fecha_registro")]
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    [Column("estado")]
    public short Estado { get; set; } = 1;
}
