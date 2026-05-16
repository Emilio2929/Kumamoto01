namespace Kumamoto.API.DTOs;

public record AdministrativoDetalleDto(
    int Id,
    string Dni,
    string Nombres,
    string Apellidos,
    string? Correo,
    string? CorreoPersonal,
    string? Telefono,
    short Estado
);

public record CreateAdministrativoDto(
    string Dni,
    string Nombres,
    string Apellidos,
    string? CorreoPersonal,
    string? Telefono
);

public record UpdateAdministrativoDto(
    string Nombres,
    string Apellidos,
    string? CorreoPersonal,
    string? Telefono
);
