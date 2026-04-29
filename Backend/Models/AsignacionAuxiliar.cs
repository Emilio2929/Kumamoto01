namespace Kumamoto.API.Models;

public class AsignacionAuxiliar
{
    public int Id { get; set; }

    public int AuxiliarId { get; set; }
    public Usuario? Auxiliar { get; set; }

    public int AulaId { get; set; }
    public Aula? Aula { get; set; }

    public string? PeriodoLectivo { get; set; }
    public short Estado { get; set; } = 1;
}

