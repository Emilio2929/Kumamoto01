namespace Kumamoto.API.DTOs;

public record EstudianteDetalleDto(
    int Id,
    string Dni,
    string Nombres,
    string Apellidos,
    string? Correo,
    string? Telefono,
    int? AulaId,
    string? GradoNombre,
    string? SeccionLetra,
    string? AulaDescripcion,
    int? PadreId,
    string? PadreNombre,
    string? PadreCorreo,
    short Estado
);

public record CreateEstudianteDto(
    string Dni,
    string Nombres,
    string Apellidos,
    string? Correo,
    string? Telefono,
    int? AulaId,
    int? PadreId
);

public record UpdateEstudianteDto(
    string Nombres,
    string Apellidos,
    string? Correo,
    string? Telefono,
    int? AulaId,
    int? PadreId
);

public record PadreComboDto(int Id, string NombreCompleto, string? Correo);
