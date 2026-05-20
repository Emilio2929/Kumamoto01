namespace Kumamoto.API.Models;

public class Competencia
{
    public int Id { get; set; }
    public int? CursoId { get; set; }
    public Curso? Curso { get; set; }
    public int? CargaId { get; set; }
    public CargaAcademica? Carga { get; set; }
    public int? GradoId { get; set; }
    public Grado? Grado { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public int NumeroOrden { get; set; }
    public short Estado { get; set; } = 1;
}
