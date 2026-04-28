namespace Kumamoto.API.DTOs;

public record HorarioDto(string DiaSemana, string HoraInicio, string HoraFin);

public record CargaAcademicaDetalleDto(
    int Id,
    int CursoId,
    string CursoNombre,
    int AulaId,
    string GradoNombre,
    string SeccionLetra,
    string? AulaDescripcion,
    int? DocenteId,
    string? DocenteNombre,
    string? PeriodoLectivo,
    short Estado,
    List<HorarioDto> Horarios
);

public record AsignarDocenteDto(
    int? DocenteId,
    string? PeriodoLectivo,
    List<HorarioDto> Horarios
);
