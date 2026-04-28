namespace Kumamoto.API.Models;

public class Curso
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public short Estado { get; set; } = 1;
}
