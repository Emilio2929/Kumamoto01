using Kumamoto.API.Data;
using Kumamoto.API.DTOs;
using Kumamoto.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Endpoints;

public static class CargaAcademicaEndpoints
{
    private const int ROL_DOCENTE = 2;

    public static void MapCargaAcademicaEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/carga-academica")
            .WithTags("Carga Académica")
            .RequireAuthorization();

        // ── GET /api/carga-academica  → todas las cargas con detalle completo
        group.MapGet("/", async (KumamotoDbContext db) =>
        {
            var cargas = await db.CargasAcademicas
                .Include(ca => ca.Curso)
                .Include(ca => ca.Aula).ThenInclude(a => a!.Grado)
                .Include(ca => ca.Aula).ThenInclude(a => a!.Seccion)
                .Include(ca => ca.Docente)
                .Include(ca => ca.Horarios)
                .Where(ca => ca.Estado == 1)
                .OrderBy(ca => ca.Aula!.Grado!.Nombre)
                .ThenBy(ca => ca.Curso!.Nombre)
                .ToListAsync();

            var result = cargas.Select(ca => new CargaAcademicaDetalleDto(
                ca.Id,
                ca.CursoId,
                ca.Curso!.Nombre,
                ca.AulaId,
                ca.Aula!.Grado!.Nombre,
                ca.Aula.Seccion!.Letra,
                ca.Aula.Descripcion,
                ca.DocenteId,
                ca.Docente != null ? $"{ca.Docente.Nombres} {ca.Docente.Apellidos}" : null,
                ca.PeriodoLectivo,
                ca.Estado,
                ca.Horarios.Select(h => new HorarioDto(
                    h.DiaSemana,
                    h.HoraInicio.ToString("HH:mm"),
                    h.HoraFin.ToString("HH:mm")
                )).OrderBy(h => h.DiaSemana).ToList()
            ));

            return Results.Ok(result);
        }).WithName("GetCargasAcademicas");

        // ── PATCH /api/carga-academica/{id}/asignar  → asigna docente + horario
        group.MapPatch("/{id:int}/asignar", async (
            int id, AsignarDocenteDto dto, KumamotoDbContext db) =>
        {
            var carga = await db.CargasAcademicas
                .Include(ca => ca.Horarios)
                .FirstOrDefaultAsync(ca => ca.Id == id);

            if (carga is null) return Results.NotFound();

            // Validar docente si se provee
            if (dto.DocenteId.HasValue)
            {
                var docente = await db.Usuarios
                    .FirstOrDefaultAsync(u => u.Id == dto.DocenteId && u.RolId == ROL_DOCENTE);
                if (docente is null)
                    return Results.BadRequest(new { mensaje = "El docente indicado no existe o no es válido." });
            }

            // ── Validar conflictos de horario ─────────────────────────────────
            foreach (var newH in dto.Horarios)
            {
                if (!TimeOnly.TryParse(newH.HoraInicio, out var ini) ||
                    !TimeOnly.TryParse(newH.HoraFin, out var fin))
                    continue;

                // 1) Docente ocupado en otra carga el mismo día y hora
                if (dto.DocenteId.HasValue)
                {
                    var confDocente = await db.HorarioDetalle
                        .Include(h => h.Carga).ThenInclude(c => c!.Curso)
                        .Include(h => h.Carga).ThenInclude(c => c!.Aula)
                            .ThenInclude(a => a!.Grado)
                        .Include(h => h.Carga).ThenInclude(c => c!.Aula)
                            .ThenInclude(a => a!.Seccion)
                        .Where(h =>
                            h.Carga!.DocenteId == dto.DocenteId &&
                            h.Carga.Id != id &&
                            h.Carga.Estado == 1 &&
                            h.DiaSemana == newH.DiaSemana &&
                            h.HoraInicio < fin &&
                            h.HoraFin > ini)
                        .FirstOrDefaultAsync();

                    if (confDocente is not null)
                    {
                        var curso = confDocente.Carga!.Curso!.Nombre;
                        var grado = confDocente.Carga.Aula!.Grado!.Nombre;
                        var sec   = confDocente.Carga.Aula.Seccion!.Letra;
                        return Results.Conflict(new
                        {
                            mensaje = $"El docente ya tiene clase el {newH.DiaSemana} de " +
                                      $"{newH.HoraInicio}–{newH.HoraFin} " +
                                      $"({curso} · {grado} Sec.{sec}). Elija otro horario."
                        });
                    }
                }

                // 2) Aula ocupada por otra carga el mismo día y hora
                var confAula = await db.HorarioDetalle
                    .Include(h => h.Carga).ThenInclude(c => c!.Curso)
                    .Where(h =>
                        h.Carga!.AulaId == carga.AulaId &&
                        h.Carga.Id != id &&
                        h.Carga.Estado == 1 &&
                        h.DiaSemana == newH.DiaSemana &&
                        h.HoraInicio < fin &&
                        h.HoraFin > ini)
                    .FirstOrDefaultAsync();

                if (confAula is not null)
                {
                    var otroCurso = confAula.Carga!.Curso!.Nombre;
                    return Results.Conflict(new
                    {
                        mensaje = $"El aula ya tiene '{otroCurso}' asignado el " +
                                  $"{newH.DiaSemana} de {newH.HoraInicio}–{newH.HoraFin}. " +
                                  $"Dos clases no pueden ocupar el aula al mismo tiempo."
                    });
                }
            }

            // ── Guardar ───────────────────────────────────────────────────────
            carga.DocenteId = dto.DocenteId;
            carga.PeriodoLectivo = dto.PeriodoLectivo?.Trim();

            db.HorarioDetalle.RemoveRange(carga.Horarios);

            foreach (var h in dto.Horarios)
            {
                if (!TimeOnly.TryParse(h.HoraInicio, out var inicio) ||
                    !TimeOnly.TryParse(h.HoraFin, out var fin))
                    continue;

                db.HorarioDetalle.Add(new HorarioCurso
                {
                    CargaId   = carga.Id,
                    DiaSemana = h.DiaSemana.Trim(),
                    HoraInicio = inicio,
                    HoraFin    = fin,
                });
            }

            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("AsignarDocente");

        // ── DELETE /api/carga-academica/{id}/docente  → quitar docente y horarios
        group.MapDelete("/{id:int}/docente", async (int id, KumamotoDbContext db) =>
        {
            var carga = await db.CargasAcademicas
                .Include(ca => ca.Horarios)
                .FirstOrDefaultAsync(ca => ca.Id == id);

            if (carga is null) return Results.NotFound();

            carga.DocenteId = null;
            carga.PeriodoLectivo = null;
            db.HorarioDetalle.RemoveRange(carga.Horarios);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("QuitarDocente");
    }
}
