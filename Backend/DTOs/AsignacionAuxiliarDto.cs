namespace Kumamoto.API.DTOs;

public record AsignacionAuxiliarDetalleDto(
    int Id,
    int AuxiliarId,
    string AuxiliarNombre,
    int AulaId,
    string GradoNombre,
    string SeccionLetra,
    string? AulaDescripcion,
    string? PeriodoLectivo,
    short Estado
);

public record AuxiliarAsignacionesGroupDto(
    int AuxiliarId,
    string AuxiliarNombre,
    List<AulaAsignadaDetalleDto> Aulas
);

public record AulaAsignadaDetalleDto(
    int AsignacionId,
    int AulaId,
    string GradoNombre,
    string SeccionLetra,
    string? AulaDescripcion,
    string? PeriodoLectivo
);

public record BulkAsignarAuxiliarDto(
    int AuxiliarId,
    List<int> AulaIds,
    string PeriodoLectivo
);

public record CreateAsignacionAuxiliarDto(
    int AuxiliarId,
    int AulaId,
    string PeriodoLectivo
);

public record UpdateAsignacionAuxiliarDto(
    int AuxiliarId,
    int AulaId,
    string PeriodoLectivo
);
