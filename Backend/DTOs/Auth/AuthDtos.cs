namespace Kumamoto.API.DTOs.Auth;

public record LoginRequest(string Correo, string Password);
public record LoginResponse(string Token, string Nombres, string Apellidos, string Rol, string Dni);
public record ForgotPasswordRequest(string Correo);
public record ResetPasswordRequest(string Correo, string Codigo, string NuevaPassword);
