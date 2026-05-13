namespace Kumamoto.API.DTOs;

public record AdministrativoDetalleDto(
    int Id,
    string Dni,
    string Nombres,
    string Apellidos,
    string? Correo,
    string? Telefono,
    short Estado
);

public record CreateAdministrativoDto(
    string Dni,
    string Nombres,
    string Apellidos,
    string Correo,
    string? Telefono
);


public record UpdateAdministrativoDto(
    string Nombres,
    string Apellidos,
    string? Correo,
    string? Telefono
);
