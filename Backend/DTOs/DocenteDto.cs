namespace Kumamoto.API.DTOs;

public record DocenteDetalleDto(
    int Id,
    string Dni,
    string Nombres,
    string Apellidos,
    string? Correo,
    string? CorreoPersonal,
    string? Telefono,
    short Estado
);

public record CreateDocenteDto(
    string Dni,
    string Nombres,
    string Apellidos,
    string? CorreoPersonal,
    string? Telefono
);

public record UpdateDocenteDto(
    string Nombres,
    string Apellidos,
    string? CorreoPersonal,
    string? Telefono
);
