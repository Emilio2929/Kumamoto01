namespace Kumamoto.API.Models;

public class PeriodoAcademico
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public DateOnly FechaInicio { get; set; }
    public DateOnly FechaFin { get; set; }
    public bool EstaCerrado { get; set; } = false;
    public short Estado { get; set; } = 1;
}
