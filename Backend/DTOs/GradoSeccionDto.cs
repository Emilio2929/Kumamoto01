namespace Kumamoto.API.DTOs;

// Grado
public record GradoDetalleDto(int Id, string Nombre, short Estado);
public record CreateGradoDto(string Nombre);
public record UpdateGradoDto(string Nombre);

// Seccion
public record SeccionDetalleDto(int Id, string Letra, short Estado);
public record CreateSeccionDto(string Letra);
public record UpdateSeccionDto(string Letra);
