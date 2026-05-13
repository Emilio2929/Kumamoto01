using System.ComponentModel.DataAnnotations.Schema;

namespace Kumamoto.API.Models;

[Table("comunicado")]
public class Comunicado
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Contenido { get; set; } = string.Empty;
    public string? UrlImagen { get; set; }
    public string? UrlArchivo { get; set; }
    public DateTime FechaPublicacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaExpiracion { get; set; }
    public bool EsImportante { get; set; } = false;
    public short Estado { get; set; } = 1;

    public int? UsuarioId { get; set; }
}
