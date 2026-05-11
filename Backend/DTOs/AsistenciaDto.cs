namespace Kumamoto.API.DTOs;

public record GuardarAsistenciaAulaItemDto(
    int EstudianteId,
    string Valor // P, F, T, J
);

public record GuardarAsistenciaAulaRequest(
    int CargaId,
    List<GuardarAsistenciaAulaItemDto> Items
);

