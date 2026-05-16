using System.Security.Cryptography;
using System.Text;
using Kumamoto.API.Data;
using Kumamoto.API.DTOs.Auth;
using Kumamoto.API.Services;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        // POST /api/auth/login
        group.MapPost("/login", async (LoginRequest request, KumamotoDbContext db, TokenService tokenService) =>
        {
            if (string.IsNullOrWhiteSpace(request.Correo) || string.IsNullOrWhiteSpace(request.Password))
                return Results.BadRequest(new { mensaje = "Correo y contraseña son requeridos." });

            var usuario = await db.Usuarios
                .Include(u => u.Rol)
                .OrderBy(u => u.Id)
                .FirstOrDefaultAsync(u => u.Correo == request.Correo && u.Estado == 1);

            if (usuario is null)
                return Results.Unauthorized();

            // Verificación híbrida de contraseña (Transición Segura)
            var hashedInput = HashPassword(request.Password);
            bool esValido = (usuario.ClaveHash == request.Password) || (usuario.ClaveHash == hashedInput);

            if (!esValido)
                return Results.Unauthorized();

            var token = tokenService.GenerarToken(usuario);

            return Results.Ok(new LoginResponse(
                Token: token,
                Nombres: usuario.Nombres,
                Apellidos: usuario.Apellidos,
                Rol: usuario.Rol?.Nombre ?? "",
                Dni: usuario.Dni
            ));
        })
        .WithName("Login")
        .WithSummary("Autenticación de usuarios — devuelve JWT")
        .WithOpenApi();
        // GET /api/auth/me
        group.MapGet("/me", async (System.Security.Claims.ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userIdStr = user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
                return Results.Unauthorized();

            var u = await db.Usuarios.FindAsync(userId);
            if (u == null) return Results.NotFound();

            return Results.Ok(new
            {
                correo = u.Correo,
                correoPersonal = u.CorreoPersonal,
                telefono = u.Telefono
            });
        }).RequireAuthorization();

        // PUT /api/auth/me
        group.MapPut("/me", async (UpdateProfileDto dto, System.Security.Claims.ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userIdStr = user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
                return Results.Unauthorized();

            var u = await db.Usuarios.FindAsync(userId);
            if (u == null) return Results.NotFound();

            u.CorreoPersonal = dto.CorreoPersonal;
            u.Telefono = dto.Telefono;
            
            await db.SaveChangesAsync();

            return Results.Ok(new { mensaje = "Datos actualizados correctamente." });
        }).RequireAuthorization();

        // PUT /api/auth/me/password
        group.MapPut("/me/password", async (ChangePasswordDto dto, System.Security.Claims.ClaimsPrincipal user, KumamotoDbContext db) =>
        {
            var userIdStr = user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
                return Results.Unauthorized();

            var u = await db.Usuarios.FindAsync(userId);
            if (u == null) return Results.NotFound();

            // Verificar contraseña actual
            var hashedCurrent = HashPassword(dto.ContrasenaActual);
            if (u.ClaveHash != dto.ContrasenaActual && u.ClaveHash != hashedCurrent)
            {
                return Results.BadRequest(new { mensaje = "La contraseña actual es incorrecta." });
            }

            u.ClaveHash = HashPassword(dto.NuevaContrasena);
            await db.SaveChangesAsync();

            return Results.Ok(new { mensaje = "Contraseña actualizada correctamente." });
        }).RequireAuthorization();
    }

    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes).ToLower();
    }
}

public class UpdateProfileDto
{
    public string? CorreoPersonal { get; set; }
    public string? Telefono { get; set; }
}

public class ChangePasswordDto
{
    public string ContrasenaActual { get; set; } = string.Empty;
    public string NuevaContrasena { get; set; } = string.Empty;
}
