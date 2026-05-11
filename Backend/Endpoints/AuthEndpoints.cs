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
                .FirstOrDefaultAsync(u => u.Correo == request.Correo && u.Estado == 1);

            if (usuario is null || usuario.ClaveHash != request.Password)
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
    }
}
