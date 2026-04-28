namespace Kumamoto.API.DTOs;

// Combo simple (para selects en otros módulos)
public record AulaDto(int Id, string Label);
public record GradoConSeccionesDto(int GradoId, string GradoNombre, List<SeccionDto> Secciones);
public record SeccionDto(int Id, string Nombre);

// CRUD completo de aulas
public record AulaDetalleDto(
    int Id,
    string GradoNombre,
    string SeccionLetra,
    string? Descripcion,
    int Capacidad,
    int GradoId,
    int SeccionId,
    short Estado
);

public record CreateAulaDto(
    int GradoId,
    int SeccionId,
    string? Descripcion,
    int Capacidad
);

public record UpdateAulaDto(
    int GradoId,
    int SeccionId,
    string? Descripcion,
    int Capacidad
);

// Dropdowns
public record GradoSimpleDto(int Id, string Nombre);
public record SeccionSimpleDto(int Id, string Letra);
