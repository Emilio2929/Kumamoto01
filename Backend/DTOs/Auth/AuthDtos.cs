namespace Kumamoto.API.DTOs.Auth;

public record LoginRequest(string Correo, string Password);
public record LoginResponse(string Token, string Nombres, string Apellidos, string Rol);
