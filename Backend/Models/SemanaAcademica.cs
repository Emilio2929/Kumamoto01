using System.ComponentModel.DataAnnotations.Schema;

namespace Kumamoto.API.Models;

[Table("semana_academica")]
public class SemanaAcademica
{
    [Column("id")]
    public int Id { get; set; }

    [Column("periodo_id")]
    public int PeriodoId { get; set; }

    public PeriodoAcademico? Periodo { get; set; }

    [Column("numero_semana")]
    public int NumeroSemana { get; set; }

    [Column("estado")]
    public short Estado { get; set; } = 1;
}
