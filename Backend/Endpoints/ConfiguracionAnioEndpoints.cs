using Kumamoto.API.Data;
using Kumamoto.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Kumamoto.API.Endpoints;

public static class ConfiguracionAnioEndpoints
{
    public static void MapConfiguracionAnioEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/configuracion-anio").WithTags("Configuración Año Lectivo").RequireAuthorization();

        // ── GET /api/configuracion-anio?anioLectivo=2026
        group.MapGet("/", async (string? anioLectivo, KumamotoDbContext db) =>
        {
            var anio = string.IsNullOrWhiteSpace(anioLectivo) ? "2026" : anioLectivo.Trim();

            var periodosDb = await db.PeriodosAcademicos
                .Where(p => p.AnioLectivo == anio && p.Estado == 1)
                .OrderBy(p => p.Numero)
                .ToListAsync();

            var periodosIds = periodosDb.Select(p => p.Id).ToList();

            var semanasDb = await db.SemanaAcademicas
                .Where(s => periodosIds.Contains(s.PeriodoId) && s.Estado == 1)
                .ToListAsync();

            var bimestres = new List<object>();

            foreach (var p in periodosDb)
            {
                var semanasCount = semanasDb.Count(s => s.PeriodoId == p.Id);
                bimestres.Add(new
                {
                    id = p.Id,
                    numero = p.Numero,
                    nombre = p.Nombre,
                    fechaInicio = p.FechaInicio.ToString("yyyy-MM-dd"),
                    fechaFin = p.FechaFin.ToString("yyyy-MM-dd"),
                    semanasCount = semanasCount
                });
            }

            return Results.Ok(new
            {
                anioLectivo = anio,
                bimestres = bimestres
            });
        }).WithName("GetConfiguracionAnio");

        // ── POST /api/configuracion-anio
        group.MapPost("/", async (ConfiguracionAnioDto dto, ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
                return Results.Unauthorized();

            var u = await db.Usuarios.FindAsync(userId);
            if (u == null) return Results.NotFound();

            if (string.IsNullOrWhiteSpace(dto.ContrasenaConfirmacion))
            {
                return Results.BadRequest(new { mensaje = "La contraseña de confirmación es requerida para realizar cambios en la matriz académica." });
            }

            var hashedInput = HashPassword(dto.ContrasenaConfirmacion);
            bool esValido = (u.ClaveHash == dto.ContrasenaConfirmacion) || (u.ClaveHash == hashedInput);

            if (!esValido)
            {
                return Results.BadRequest(new { mensaje = "La contraseña de confirmación es incorrecta. No se autorizó la modificación." });
            }

            var anio = string.IsNullOrWhiteSpace(dto.AnioLectivo) ? "2026" : dto.AnioLectivo.Trim();

            var periodosExistentes = await db.PeriodosAcademicos
                .Where(p => p.AnioLectivo == anio)
                .ToListAsync();

            var periodosExistentesIds = periodosExistentes.Select(p => p.Id).ToList();

            var semanasExistentes = await db.SemanaAcademicas
                .Where(s => periodosExistentesIds.Contains(s.PeriodoId))
                .ToListAsync();

            var nuevosNumeros = dto.Bimestres.Select(b => b.Numero).ToList();

            // 1. Marcar como inactivos (Estado = 0) los bimestres que ya no estén en la nueva configuración
            foreach (var pExist in periodosExistentes)
            {
                if (!nuevosNumeros.Contains(pExist.Numero))
                {
                    pExist.Estado = 0;
                    var semanasP = semanasExistentes.Where(s => s.PeriodoId == pExist.Id).ToList();
                    foreach (var s in semanasP)
                    {
                        s.Estado = 0;
                    }
                }
            }

            // 2. Actualizar o crear bimestres y sus semanas
            try
            {
                foreach (var bDto in dto.Bimestres.OrderBy(b => b.Numero))
                {
                    var periodo = periodosExistentes.FirstOrDefault(p => p.Numero == bDto.Numero);

                    if (!DateTime.TryParse(bDto.FechaInicio, out var dtInicio)) dtInicio = DateTime.Now;
                    if (!DateTime.TryParse(bDto.FechaFin, out var dtFin)) dtFin = DateTime.Now.AddMonths(2);
                    var fInicio = DateOnly.FromDateTime(dtInicio);
                    var fFin = DateOnly.FromDateTime(dtFin);

                    if (periodo == null)
                    {
                        periodo = new PeriodoAcademico
                        {
                            AnioLectivo = anio,
                            Numero = bDto.Numero,
                            Nombre = string.IsNullOrWhiteSpace(bDto.Nombre) ? $"{bDto.Numero}° Bimestre" : bDto.Nombre.Trim(),
                            FechaInicio = fInicio,
                            FechaFin = fFin,
                            EstaCerrado = false,
                            Estado = 1
                        };
                        db.PeriodosAcademicos.Add(periodo);
                        await db.SaveChangesAsync(); // Guardamos para obtener el Id generado
                    }
                    else
                    {
                        periodo.Nombre = string.IsNullOrWhiteSpace(bDto.Nombre) ? $"{bDto.Numero}° Bimestre" : bDto.Nombre.Trim();
                        periodo.FechaInicio = fInicio;
                        periodo.FechaFin = fFin;
                        periodo.Estado = 1;
                        await db.SaveChangesAsync();
                    }

                    // Gestionar semanas del periodo
                    var semanasPeriodo = semanasExistentes.Where(s => s.PeriodoId == periodo.Id).ToList();

                    // 1. Asegurar que las semanas 1 hasta bDto.SemanasCount estén activas (creándolas si no existen)
                    for (int i = 1; i <= bDto.SemanasCount; i++)
                    {
                        var sem = semanasPeriodo.FirstOrDefault(s => s.NumeroSemana == i);
                        if (sem != null)
                        {
                            sem.Estado = 1;
                        }
                        else
                        {
                            var newSem = new SemanaAcademica
                            {
                                PeriodoId = periodo.Id,
                                NumeroSemana = i,
                                Estado = 1
                            };
                            db.SemanaAcademicas.Add(newSem);
                            semanasPeriodo.Add(newSem);
                        }
                    }

                    // 2. Desactivar cualquier semana excedente (NumeroSemana > bDto.SemanasCount)
                    foreach (var sem in semanasPeriodo.Where(s => s.NumeroSemana > bDto.SemanasCount))
                    {
                        sem.Estado = 0;
                    }

                    await db.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR FATAL] {ex.Message} {ex.InnerException?.Message}");
                return Results.BadRequest(new { mensaje = $"Error interno al guardar: {ex.InnerException?.Message ?? ex.Message}" });
            }

            return Results.Ok(new { mensaje = "Configuración del año lectivo guardada y sincronizada correctamente." });
        }).WithName("SaveConfiguracionAnio");
    }

    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes).ToLower();
    }
}

public class ConfiguracionAnioDto
{
    public string AnioLectivo { get; set; } = "2026";
    public string ContrasenaConfirmacion { get; set; } = string.Empty;
    public List<BimestreConfigDto> Bimestres { get; set; } = new();
}

public class BimestreConfigDto
{
    public int Numero { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string FechaInicio { get; set; } = string.Empty;
    public string FechaFin { get; set; } = string.Empty;
    public int SemanasCount { get; set; }
}
