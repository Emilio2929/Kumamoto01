namespace Kumamoto.API.Models;

public class Grado
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public short Estado { get; set; } = 1;

    public List<Aula> Aulas { get; set; } = [];
}
