namespace Kumamoto.API.Models;

public class HorarioCurso
{
    public int Id { get; set; }
    public int CargaId { get; set; }
    public string DiaSemana { get; set; } = string.Empty;
    public TimeOnly HoraInicio { get; set; }
    public TimeOnly HoraFin { get; set; }
    public short Estado { get; set; } = 1;

    public CargaAcademica? Carga { get; set; }
}
