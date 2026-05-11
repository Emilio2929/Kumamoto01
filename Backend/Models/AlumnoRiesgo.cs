using System.ComponentModel.DataAnnotations.Schema;

namespace Kumamoto.API.Models;

public class AlumnoRiesgo
{
    public int Id { get; set; }
    public int EstudianteId { get; set; }
    public Estudiante? Estudiante { get; set; }

    public string NivelRiesgo { get; set; } = "Bajo"; // Bajo, Medio, Alto
    public string Motivo { get; set; } = string.Empty;
    public string Recomendacion { get; set; } = string.Empty;
    public DateTime FechaCalculo { get; set; } = DateTime.UtcNow;

    public int? Bimestre { get; set; }
    public short Estado { get; set; } = 1;
}
