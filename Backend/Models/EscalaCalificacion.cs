using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kumamoto.API.Models;

[Table("escala_calificacion")]
public class EscalaCalificacion
{
    [Column("id")]
    public int Id { get; set; }

    [Column("letra")]
    [MaxLength(2)]
    public string Letra { get; set; } = string.Empty;

    [Column("descripcion")]
    [MaxLength(50)]
    public string Descripcion { get; set; } = string.Empty;

    [Column("significado")]
    public string Significado { get; set; } = string.Empty;

    [Column("requiere_intervencion")]
    public bool RequiereIntervencion { get; set; }

    [Column("estado")]
    public short Estado { get; set; } = 1;
}
