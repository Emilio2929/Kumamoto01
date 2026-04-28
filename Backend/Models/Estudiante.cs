namespace Kumamoto.API.Models;

public class Estudiante
{
    public int Id { get; set; }
    public string Dni { get; set; } = string.Empty;
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string? Correo { get; set; }
    public string? Telefono { get; set; }
    public int? AulaId { get; set; }
    public Aula? Aula { get; set; }
    public int? PadreId { get; set; }
    public Usuario? Padre { get; set; }
    public short Estado { get; set; } = 1;
}
