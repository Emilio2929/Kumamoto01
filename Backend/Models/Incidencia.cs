namespace Kumamoto.API.Models;

public class Incidencia
{
    public int Id { get; set; }

    public int EstudianteId { get; set; }
    public Estudiante? Estudiante { get; set; }

    public int RegistradoPorId { get; set; }
    public Usuario? RegistradoPor { get; set; }

    public string? TipoIncidencia { get; set; }
    public string? Descripcion { get; set; }

    public DateTime FechaRegistro { get; set; }
    public short Estado { get; set; } = 1;
}

