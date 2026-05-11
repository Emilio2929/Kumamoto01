namespace Kumamoto.API.DTOs;

public record CrearCompetenciaRequest(int CargaId, string Codigo, string Nombre);

public record CompetenciaDto(int Id, string Codigo, string Nombre);

public record PlanillaResponse(
    List<CompetenciaDto> Competencias,
    List<AlumnoPlanillaDto> Alumnos
);

public record NotaCeldaDto(string? Valor, bool Bloqueado);

public record AlumnoPlanillaDto(
    int EstudianteId,
    string NombreCompleto,
    bool TieneAlerta,
    Dictionary<string, NotaCeldaDto> Notas // Key is CompetenciaId stringified
);

public record BulkSaveNotasRequest(
    int CargaId,
    int SemanaId,
    List<NotaItem> Notas
);

public record NotaItem(
    int EstudianteId,
    int CompetenciaId,
    string Nota
);
