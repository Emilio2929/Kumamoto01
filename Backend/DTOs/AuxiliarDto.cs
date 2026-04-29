namespace Kumamoto.API.DTOs;

public record AulaAsignadaAuxiliarDto(
    int AsignacionAuxiliarId,
    int AulaId,
    string GradoNombre,
    string SeccionLetra,
    string? AulaDescripcion,
    string? CursoActual,
    string? HorarioClase,
    bool EnHorario,
    string EstadoAsistenciaHoy // "Pendiente", "RegistradaAuxiliar", "RegistradaDocente"
);

public record AsistenciaAlumnoHoyDto(
    int EstudianteId,
    string Nombres,
    string Apellidos,
    string? Valor
);
