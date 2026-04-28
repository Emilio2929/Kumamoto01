using Kumamoto.API.Data;
using Kumamoto.API.DTOs;
using Kumamoto.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Endpoints;

public static class GradosSeccionesEndpoints
{
    public static void MapGradosSeccionesEndpoints(this WebApplication app)
    {
        // ══════════════════════════════════════════════════════════════════
        //  GRADOS
        // ══════════════════════════════════════════════════════════════════
        var grados = app.MapGroup("/api/grados").WithTags("Grados").RequireAuthorization();

        // GET /api/grados  → todos (activos + inactivos)
        grados.MapGet("/", async (KumamotoDbContext db) =>
        {
            var list = await db.Grados
                .OrderBy(g => g.Nombre)
                .Select(g => new GradoDetalleDto(g.Id, g.Nombre, g.Estado))
                .ToListAsync();
            return Results.Ok(list);
        }).WithName("GetGrados").WithSummary("Lista todos los grados");

        // POST /api/grados
        grados.MapPost("/", async (CreateGradoDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Nombre))
                return Results.BadRequest(new { mensaje = "El nombre es requerido." });

            var existe = await db.Grados.AnyAsync(g => g.Nombre == dto.Nombre.Trim());
            if (existe)
                return Results.Conflict(new { mensaje = "Ya existe un grado con ese nombre." });

            var grado = new Grado { Nombre = dto.Nombre.Trim(), Estado = 1 };
            db.Grados.Add(grado);
            await db.SaveChangesAsync();
            return Results.Created($"/api/grados/{grado.Id}", new { grado.Id });
        }).WithName("CreateGrado").WithSummary("Crear grado");

        // PUT /api/grados/{id}
        grados.MapPut("/{id:int}", async (int id, UpdateGradoDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Nombre))
                return Results.BadRequest(new { mensaje = "El nombre es requerido." });

            var grado = await db.Grados.FindAsync(id);
            if (grado is null) return Results.NotFound();

            var duplicado = await db.Grados.AnyAsync(g => g.Nombre == dto.Nombre.Trim() && g.Id != id);
            if (duplicado)
                return Results.Conflict(new { mensaje = "Ya existe otro grado con ese nombre." });

            grado.Nombre = dto.Nombre.Trim();
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("UpdateGrado").WithSummary("Editar grado");

        // PATCH /api/grados/{id}/estado  → toggle activo/inactivo
        grados.MapPatch("/{id:int}/estado", async (int id, KumamotoDbContext db) =>
        {
            var grado = await db.Grados.FindAsync(id);
            if (grado is null) return Results.NotFound();
            grado.Estado = grado.Estado == 1 ? (short)0 : (short)1;
            await db.SaveChangesAsync();
            return Results.Ok(new { grado.Estado });
        }).WithName("ToggleGradoEstado").WithSummary("Activar/desactivar grado");

        // DELETE /api/grados/{id}  → eliminación lógica
        grados.MapDelete("/{id:int}", async (int id, KumamotoDbContext db) =>
        {
            var grado = await db.Grados.FindAsync(id);
            if (grado is null) return Results.NotFound();
            grado.Estado = 0;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("DeleteGrado").WithSummary("Eliminación lógica de grado");


        // ══════════════════════════════════════════════════════════════════
        //  SECCIONES
        // ══════════════════════════════════════════════════════════════════
        var secciones = app.MapGroup("/api/secciones").WithTags("Secciones").RequireAuthorization();

        // GET /api/secciones
        secciones.MapGet("/", async (KumamotoDbContext db) =>
        {
            var list = await db.Secciones
                .OrderBy(s => s.Letra)
                .Select(s => new SeccionDetalleDto(s.Id, s.Letra, s.Estado))
                .ToListAsync();
            return Results.Ok(list);
        }).WithName("GetSecciones").WithSummary("Lista todas las secciones");

        // POST /api/secciones
        secciones.MapPost("/", async (CreateSeccionDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Letra))
                return Results.BadRequest(new { mensaje = "La letra es requerida." });

            var letra = dto.Letra.Trim().ToUpper();
            var existe = await db.Secciones.AnyAsync(s => s.Letra == letra);
            if (existe)
                return Results.Conflict(new { mensaje = "Ya existe una sección con esa letra." });

            var seccion = new Seccion { Letra = letra, Estado = 1 };
            db.Secciones.Add(seccion);
            await db.SaveChangesAsync();
            return Results.Created($"/api/secciones/{seccion.Id}", new { seccion.Id });
        }).WithName("CreateSeccion").WithSummary("Crear sección");

        // PUT /api/secciones/{id}
        secciones.MapPut("/{id:int}", async (int id, UpdateSeccionDto dto, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Letra))
                return Results.BadRequest(new { mensaje = "La letra es requerida." });

            var seccion = await db.Secciones.FindAsync(id);
            if (seccion is null) return Results.NotFound();

            var letra = dto.Letra.Trim().ToUpper();
            var duplicada = await db.Secciones.AnyAsync(s => s.Letra == letra && s.Id != id);
            if (duplicada)
                return Results.Conflict(new { mensaje = "Ya existe otra sección con esa letra." });

            seccion.Letra = letra;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("UpdateSeccion").WithSummary("Editar sección");

        // PATCH /api/secciones/{id}/estado
        secciones.MapPatch("/{id:int}/estado", async (int id, KumamotoDbContext db) =>
        {
            var seccion = await db.Secciones.FindAsync(id);
            if (seccion is null) return Results.NotFound();
            seccion.Estado = seccion.Estado == 1 ? (short)0 : (short)1;
            await db.SaveChangesAsync();
            return Results.Ok(new { seccion.Estado });
        }).WithName("ToggleSeccionEstado").WithSummary("Activar/desactivar sección");

        // DELETE /api/secciones/{id}
        secciones.MapDelete("/{id:int}", async (int id, KumamotoDbContext db) =>
        {
            var seccion = await db.Secciones.FindAsync(id);
            if (seccion is null) return Results.NotFound();
            seccion.Estado = 0;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithName("DeleteSeccion").WithSummary("Eliminación lógica de sección");
    }
}
