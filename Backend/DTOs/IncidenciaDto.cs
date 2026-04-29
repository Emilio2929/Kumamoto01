namespace Kumamoto.API.DTOs;

public record CrearIncidenciaRequest(
    int EstudianteId,
    string TipoIncidencia,
    string? Descripcion
);

