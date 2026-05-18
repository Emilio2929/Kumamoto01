using System.ComponentModel.DataAnnotations.Schema;

namespace Kumamoto.API.Models;

[Table("notificacion")]
public class Notificacion
{
    public int Id { get; set; }

    public int UsuarioDestinoId { get; set; }
    public Usuario? UsuarioDestino { get; set; }

    public int? EstudianteId { get; set; }
    public Estudiante? Estudiante { get; set; }

    public int RemitenteId { get; set; }
    public Usuario? Remitente { get; set; }

    public string Tipo { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;

    public DateTime FechaEnvio { get; set; } = DateTime.UtcNow;
    public short Leido { get; set; } = 0;
    public short Estado { get; set; } = 1;
}
