using System;

namespace Kumamoto.API.Models;

public class Calificacion
{
    public int Id { get; set; }
    public int? EstudianteId { get; set; }
    public Estudiante? Estudiante { get; set; }
    public int? CargaId { get; set; }
    public CargaAcademica? Carga { get; set; }
    public int? PeriodoId { get; set; }
    public PeriodoAcademico? Periodo { get; set; }
    public int? CompetenciaId { get; set; }
    public Competencia? Competencia { get; set; }
    public string Nota { get; set; } = string.Empty;
    public DateTime FechaRegistro { get; set; } = DateTime.Now;
    public short Estado { get; set; } = 1;
}
