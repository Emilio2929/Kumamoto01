namespace Kumamoto.API.DTOs;

public record DocenteDetalleDto(
    int Id,
    string Dni,
    string Nombres,
    string Apellidos,
    string? Correo,
    string? Telefono,
    short Estado
);

public record CreateDocenteDto(
    string Dni,
    string Nombres,
    string Apellidos,
    string? Telefono
);

public record UpdateDocenteDto(
    string Nombres,
    string Apellidos,
    string? Correo,
    string? Telefono
);
