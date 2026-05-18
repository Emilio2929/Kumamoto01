namespace Kumamoto.API.Models;

public class NivelEducativo
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public short Estado { get; set; } = 1;

    public List<Grado> Grados { get; set; } = [];
    public List<Aula> Aulas { get; set; } = [];
    public List<Usuario> Usuarios { get; set; } = [];
    public List<Estudiante> Estudiantes { get; set; } = [];
}
