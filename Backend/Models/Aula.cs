namespace Kumamoto.API.Models;

public class Aula
{
    public int Id { get; set; }
    public string? Descripcion { get; set; }
    public int Capacidad { get; set; }
    public int GradoId { get; set; }
    public int SeccionId { get; set; }
    public short Estado { get; set; } = 1;

    public Grado? Grado { get; set; }
    public Seccion? Seccion { get; set; }
}
