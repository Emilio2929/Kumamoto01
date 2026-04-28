namespace Kumamoto.API.Models;

public class Rol
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public short Estado { get; set; } = 1;

    public List<Usuario> Usuarios { get; set; } = [];
}
