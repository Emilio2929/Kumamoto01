using System.Security.Claims;
using Kumamoto.API.Data;
using Kumamoto.API.DTOs;
using Kumamoto.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Endpoints;

public static class ComunicadoEndpoints
{
    public static void MapComunicadoEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/comunicados").WithTags("Comunicados");

        // GET /api/comunicados -> Obtener todos los activos (público)
        group.MapGet("/", async (KumamotoDbContext db) =>
        {
            return await db.Comunicados
                .Where(c => c.Estado == 1)
                .OrderByDescending(c => c.EsImportante)
                .ThenByDescending(c => c.FechaPublicacion)
                .Select(c => new ComunicadoDto(
                    c.Id, c.Titulo, c.Contenido, c.UrlImagen, c.UrlArchivo, 
                    c.FechaPublicacion, c.EsImportante, c.Estado, c.UsuarioId))
                .ToListAsync();
        });

        // POST /api/comunicados -> Crear (Admin/Director)
        group.MapPost("/", async (CreateComunicadoDto dto, KumamotoDbContext db, ClaimsPrincipal user) =>
        {
            // Validaciones básicas de seguridad
            if (string.IsNullOrWhiteSpace(dto.Titulo) || string.IsNullOrWhiteSpace(dto.Contenido))
                return Results.BadRequest(new { mensaje = "Título y contenido son requeridos." });

            // Extraer ID del usuario desde el Token
            var userIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value;
            int? userId = int.TryParse(userIdStr, out var id) ? id : null;

            var comunicado = new Comunicado
            {
                Titulo = dto.Titulo.Trim(),
                Contenido = dto.Contenido.Trim(),
                UrlImagen = dto.UrlImagen,
                UrlArchivo = dto.UrlArchivo,
                EsImportante = dto.EsImportante,
                FechaPublicacion = DateTime.UtcNow,
                UsuarioId = userId,
                Estado = 1 // Aseguramos que se cree activo
            };

            db.Comunicados.Add(comunicado);
            await db.SaveChangesAsync();
            return Results.Created($"/api/comunicados/{comunicado.Id}", comunicado);
        }).RequireAuthorization(policy => policy.RequireRole("Director", "Administrativo"));

        // PUT /api/comunicados/{id} -> Actualizar (Admin/Director)
        group.MapPut("/{id:int}", async (int id, CreateComunicadoDto dto, KumamotoDbContext db) =>
        {
            var comunicado = await db.Comunicados.FindAsync(id);
            if (comunicado == null) return Results.NotFound();

            if (string.IsNullOrWhiteSpace(dto.Titulo) || string.IsNullOrWhiteSpace(dto.Contenido))
                return Results.BadRequest(new { mensaje = "Título y contenido son requeridos." });

            comunicado.Titulo = dto.Titulo.Trim();
            comunicado.Contenido = dto.Contenido.Trim();
            comunicado.UrlImagen = dto.UrlImagen;
            comunicado.UrlArchivo = dto.UrlArchivo;
            comunicado.EsImportante = dto.EsImportante;

            await db.SaveChangesAsync();
            return Results.Ok(comunicado);
        }).RequireAuthorization(policy => policy.RequireRole("Director", "Administrativo"));

        // DELETE /api/comunicados/{id} -> Dar de baja (Admin/Director)
        group.MapDelete("/{id:int}", async (int id, KumamotoDbContext db) =>
        {
            var comunicado = await db.Comunicados.FindAsync(id);
            if (comunicado == null) return Results.NotFound();
            
            comunicado.Estado = 0; // Baja lógica
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization(policy => policy.RequireRole("Director", "Administrativo"));
    }
}
