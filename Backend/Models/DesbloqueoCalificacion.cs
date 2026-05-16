using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kumamoto.API.Models;

[Table("desbloqueo_calificacion")]
public class DesbloqueoCalificacion
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("carga_id")]
    public int CargaId { get; set; }

    [Column("semana_id")]
    public int SemanaId { get; set; }

    [Column("estudiante_id")]
    public int EstudianteId { get; set; }

    [Column("habilitado_por_id")]
    public int HabilitadoPorId { get; set; }

    [Column("fecha_autorizacion")]
    public DateTime FechaAutorizacion { get; set; }

    [Column("fecha_expiracion")]
    public DateTime FechaExpiracion { get; set; }

    [Column("estado")]
    public int Estado { get; set; } // 1 activo, 0 inactivo

    public CargaAcademica? Carga { get; set; }
    public SemanaAcademica? Semana { get; set; }
    public Estudiante? Estudiante { get; set; }
    public Usuario? HabilitadoPor { get; set; }
}
