namespace Kumamoto.API.Models;

public class Asistencia
{
    public int Id { get; set; }
    public int? EstudianteId { get; set; }
    public Estudiante? Estudiante { get; set; }
    public DateOnly Fecha { get; set; }
    public string? Valor { get; set; } // P, F, T, J
    public short Estado { get; set; } = 1;
}
