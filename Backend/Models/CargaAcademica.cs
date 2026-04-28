namespace Kumamoto.API.Models;

public class CargaAcademica
{
    public int Id { get; set; }
    public int? DocenteId { get; set; }
    public int CursoId { get; set; }
    public int AulaId { get; set; }
    public string? PeriodoLectivo { get; set; }
    public short Estado { get; set; } = 1;

    // Navigation properties
    public Curso? Curso { get; set; }
    public Aula? Aula { get; set; }
    public Usuario? Docente { get; set; }
    public List<HorarioCurso> Horarios { get; set; } = [];
}
