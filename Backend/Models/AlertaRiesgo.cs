namespace Kumamoto.API.Models;

public class AlertaRiesgo
{
    public int Id { get; set; }
    public int? EstudianteId { get; set; }
    public Estudiante? Estudiante { get; set; }
    public string? NivelRiesgo { get; set; } // Alto, Medio, Bajo
    public string? Motivo { get; set; }
    public short Estado { get; set; } = 1;
}
