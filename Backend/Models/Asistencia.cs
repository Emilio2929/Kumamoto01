namespace Kumamoto.API.Models;

public class Asistencia
{
    public int Id { get; set; }
    public int EstudianteId { get; set; }
    public Estudiante? Estudiante { get; set; }

    public int RegistradoPorId { get; set; }
    public Usuario? RegistradoPor { get; set; }

    public int? CargaAcademicaId { get; set; }
    public CargaAcademica? CargaAcademica { get; set; }

    public int? AsignacionAuxiliarId { get; set; }
    public AsignacionAuxiliar? AsignacionAuxiliar { get; set; }

    public DateOnly Fecha { get; set; }
    public string? Valor { get; set; } // P, F, T, J
    public short Estado { get; set; } = 1;
}
