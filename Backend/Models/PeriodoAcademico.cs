using System.ComponentModel.DataAnnotations.Schema;

namespace Kumamoto.API.Models;

public class PeriodoAcademico
{
    public int Id { get; set; }

    [Column("anio_lectivo")]
    public string AnioLectivo { get; set; } = "2026";

    [Column("numero")]
    public int Numero { get; set; } = 1;

    public string Nombre { get; set; } = string.Empty;
    public DateOnly FechaInicio { get; set; }
    public DateOnly FechaFin { get; set; }
    public bool EstaCerrado { get; set; } = false;
    public short Estado { get; set; } = 1;
}
