namespace Kumamoto.API.Models;

public class Usuario
{
    public int Id { get; set; }
    public string Dni { get; set; } = string.Empty;
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string? Correo { get; set; }
    public string? CorreoPersonal { get; set; }
    public string? Telefono { get; set; }
    public string ClaveHash { get; set; } = string.Empty;
    public int RolId { get; set; }
    public short Estado { get; set; } = 1;

    public Rol? Rol { get; set; }
}
