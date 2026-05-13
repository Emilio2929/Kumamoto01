namespace Kumamoto.API.DTOs;

public record PadreDetalleDto(
    int Id,
    string Dni,
    string Nombres,
    string Apellidos,
    string? Correo,
    string? Telefono,
    short Estado
);

public record CreatePadreDto(
    string Dni,
    string Nombres,
    string Apellidos,
    string? Correo,
    string? Telefono
);



public record UpdatePadreDto(
    string Nombres,
    string Apellidos,
    string? Correo,
    string? Telefono
);

public record CambiarClaveDto(
    string NuevaClave
);
