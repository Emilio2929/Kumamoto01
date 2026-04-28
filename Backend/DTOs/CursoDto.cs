namespace Kumamoto.API.DTOs;

// ── Curso detalle (con aulas asignadas)
public record CursoDetalleDto(
    int Id,
    string Nombre,
    short Estado,
    List<AulaAsignadaDto> Aulas
);

public record AulaAsignadaDto(
    int CargaId,
    int AulaId,
    string GradoNombre,
    string SeccionLetra,
    string? Descripcion
);

// ── Combo simple para selects
public record CursoComboDto(int Id, string Nombre);

// ── CRUD curso
public record CreateCursoDto(string Nombre);
public record UpdateCursoDto(string Nombre);

// ── Asignar curso a aula
public record AsignarAulaDto(int AulaId);
