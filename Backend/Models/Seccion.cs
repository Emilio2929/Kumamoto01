namespace Kumamoto.API.Models;

public class Seccion
{
    public int Id { get; set; }
    public string Letra { get; set; } = string.Empty;
    public short Estado { get; set; } = 1;

    public List<Aula> Aulas { get; set; } = [];
}
