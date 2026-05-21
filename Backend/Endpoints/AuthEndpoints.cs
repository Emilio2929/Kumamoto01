using System.Security.Cryptography;
using System.Text;
using Kumamoto.API.Data;
using Kumamoto.API.DTOs.Auth;
using Kumamoto.API.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Kumamoto.API.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        // POST /api/auth/login
        group.MapPost("/login", async (LoginRequest request, KumamotoDbContext db, TokenService tokenService, HttpContext context, IConfiguration config) =>
        {
            if (string.IsNullOrWhiteSpace(request.Correo) || string.IsNullOrWhiteSpace(request.Password))
                return Results.BadRequest(new { mensaje = "Correo y contraseña son requeridos." });

            var usuario = await db.Usuarios
                .Include(u => u.Rol)
                .OrderBy(u => u.Id)
                .FirstOrDefaultAsync(u => u.Correo == request.Correo && u.Estado == 1);

            if (usuario is null)
                return Results.BadRequest(new { mensaje = "Credenciales incorrectas. Intenta de nuevo." });

            // Verificación híbrida de contraseña (Transición Segura)
            var hashedInput = HashPassword(request.Password);
            bool esValido = (usuario.ClaveHash == request.Password) || (usuario.ClaveHash == hashedInput);

            if (!esValido)
                return Results.BadRequest(new { mensaje = "Credenciales incorrectas. Intenta de nuevo." });

            // Generar JWT
            var token = tokenService.GenerarToken(usuario);

            // Inyectar JWT en Cookie Segura HttpOnly
            var isProduction = context.Request.IsHttps || config["ASPNETCORE_ENVIRONMENT"] == "Production";
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true, // Bloquea XSS
                Secure = true, // OBLIGATORIO ser true cuando SameSite es None
                SameSite = SameSiteMode.None, // Permite compartir la cookie entre dominios distintos (Vercel -> Render)
                // Al NO definir 'Expires' ni 'MaxAge', se convierte en una Cookie de Sesión
            };

            context.Response.Cookies.Append("kumamoto_jwt", token, cookieOptions);

            // Retornamos la respuesta CON el token para que el cliente lo use como Bearer
            return Results.Ok(new {
                token = token, // Token real para Bearer authentication
                id = usuario.Id,
                nombres = usuario.Nombres,
                apellidos = usuario.Apellidos,
                rol = usuario.Rol?.Nombre ?? "",
                dni = usuario.Dni
            });
        })
        .WithName("Login")
        .WithSummary("Autenticación (Bearer Token)")
        .WithOpenApi()
        .RequireRateLimiting("LoginPolicy"); // Fuerza bruta bloqueada

        // POST /api/auth/logout
        group.MapPost("/logout", (HttpContext context) =>
        {
            // Eliminar la cookie de forma segura
            context.Response.Cookies.Delete("kumamoto_jwt", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None
            });
            return Results.Ok(new { mensaje = "Sesión cerrada correctamente." });
        })
        .WithName("Logout")
        .WithSummary("Cerrar sesión (Borrar Cookie)");

        // POST /api/auth/forgot-password
        group.MapPost("/forgot-password", async (ForgotPasswordRequest request, KumamotoDbContext db, EmailService emailService) =>
        {
            if (string.IsNullOrWhiteSpace(request.Correo))
                return Results.BadRequest(new { mensaje = "El correo electrónico es requerido." });

            var correoLimpio = request.Correo.Trim();
            var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Correo == correoLimpio && u.Estado == 1);
            if (usuario == null)
            {
                // Por seguridad, no revelamos si el correo existe
                return Results.Ok(new { mensaje = "Si el correo existe en nuestro sistema, recibirás un código de verificación." });
            }

            var codigo = Random.Shared.Next(100000, 999999).ToString();
            usuario.CodigoRecuperacion = codigo;
            usuario.FechaExpiracionCodigo = DateTime.UtcNow.AddMinutes(15);
            await db.SaveChangesAsync();

            var correoDestino = !string.IsNullOrWhiteSpace(usuario.CorreoPersonal) ? usuario.CorreoPersonal : usuario.Correo!;

            await emailService.EnviarCodigoRecuperacionAsync(correoDestino, codigo);

            var partes = correoDestino.Split('@');
            var correoEnmascarado = partes[0].Length > 2 
                ? $"{partes[0].Substring(0, 2)}****@{partes[1]}" 
                : $"****@{partes[1]}";

            return Results.Ok(new { 
                mensaje = $"Código de verificación enviado exitosamente a su correo registrado ({correoEnmascarado}).",
                correoEnmascarado = correoEnmascarado 
            });
        })
        .WithName("ForgotPassword")
        .WithSummary("Recuperar contraseña")
        .WithOpenApi()
        .RequireRateLimiting("LoginPolicy");

        // POST /api/auth/reset-password
        group.MapPost("/reset-password", async (ResetPasswordRequest request, KumamotoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(request.Correo) || string.IsNullOrWhiteSpace(request.Codigo) || string.IsNullOrWhiteSpace(request.NuevaPassword))
                return Results.BadRequest(new { mensaje = "Todos los campos son requeridos." });

            var correoLimpio = request.Correo.Trim();
            var codigoLimpio = request.Codigo.Trim();
            var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Correo == correoLimpio && u.CodigoRecuperacion == codigoLimpio && u.Estado == 1);
            if (usuario == null)
                return Results.BadRequest(new { mensaje = "El código de verificación es incorrecto o ha expirado." });

            if (usuario.FechaExpiracionCodigo.HasValue && usuario.FechaExpiracionCodigo.Value < DateTime.UtcNow)
                return Results.BadRequest(new { mensaje = "El código de verificación ha expirado. Por favor, solicita uno nuevo." });

            var nuevaPassword = request.NuevaPassword.Trim();
            if (!IsValidStrongPassword(nuevaPassword))
                return Results.BadRequest(new { mensaje = "La contraseña debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas, números y un carácter especial (ej. Toby2025.2909)." });

            usuario.ClaveHash = HashPassword(nuevaPassword);
            usuario.CodigoRecuperacion = null;
            usuario.FechaExpiracionCodigo = null;
            await db.SaveChangesAsync();

            return Results.Ok(new { mensaje = "Tu contraseña ha sido actualizada exitosamente." });
        })
        .WithName("ResetPassword")
        .WithSummary("Restablecer contraseña");

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

            var nuevaPassword = dto.NuevaContrasena.Trim();
            if (!IsValidStrongPassword(nuevaPassword))
                return Results.BadRequest(new { mensaje = "La contraseña nueva debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas, números y un carácter especial (ej. Toby2025.2909)." });

            u.ClaveHash = HashPassword(nuevaPassword);
            await db.SaveChangesAsync();

            return Results.Ok(new { mensaje = "Contraseña actualizada correctamente." });
        }).RequireAuthorization();
    }

    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes).ToLower();
    }

    private static bool IsValidStrongPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < 8) return false;
        
        bool hasUpper = password.Any(char.IsUpper);
        bool hasLower = password.Any(char.IsLower);
        bool hasDigit = password.Any(char.IsDigit);
        bool hasSpecial = password.Any(c => !char.IsLetterOrDigit(c));
        
        return hasUpper && hasLower && hasDigit && hasSpecial;
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
