namespace Kumamoto.API.DTOs;

public record AuxiliarDetalleDto(
    int Id,
    string Dni,
    string Nombres,
    string Apellidos,
    string? Correo,
    string? CorreoPersonal,
    string? Telefono,
    short Estado
);

public record CreateAuxiliarDto(
    string Dni,
    string Nombres,
    string Apellidos,
    string? CorreoPersonal,
    string? Telefono
);

public record UpdateAuxiliarDto(
    string Nombres,
    string Apellidos,
    string? CorreoPersonal,
    string? Telefono
);
