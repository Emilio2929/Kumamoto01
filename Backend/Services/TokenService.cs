using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Kumamoto.API.Models;
using Microsoft.IdentityModel.Tokens;

namespace Kumamoto.API.Services;

public class TokenService(IConfiguration config)
{
    public string GenerarToken(Usuario usuario)
    {
        // Lee JWT_SECRET desde variable de entorno (producción) o Jwt:Key desde appsettings (desarrollo)
        var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? config["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT_SECRET no configurado.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.Name, $"{usuario.Nombres} {usuario.Apellidos}"),
            new(ClaimTypes.Role, usuario.Rol?.Nombre ?? ""),
            new("dni", usuario.Dni),
            new("rol", usuario.Rol?.Nombre ?? "")
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
