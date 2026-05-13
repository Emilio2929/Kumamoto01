namespace Kumamoto.API.DTOs;

public record ComunicadoDto(
    int Id,
    string Titulo,
    string Contenido,
    string? UrlImagen,
    string? UrlArchivo,
    DateTime FechaPublicacion,
    bool EsImportante,
    short Estado,
    int? UsuarioId
);

public record CreateComunicadoDto(
    string Titulo,
    string Contenido,
    string? UrlImagen,
    string? UrlArchivo,
    bool EsImportante = false
);
