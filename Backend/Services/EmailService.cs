using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Resend;

namespace Kumamoto.API.Services;

public class EmailService
{
    private readonly IResend _resend;
    private readonly ILogger<EmailService> _logger;
    private readonly IConfiguration _config;

    public EmailService(IResend resend, ILogger<EmailService> logger, IConfiguration config)
    {
        _resend = resend;
        _logger = logger;
        _config = config;
    }

    public async Task EnviarCodigoRecuperacionAsync(string correoDestino, string codigo)
    {
        _logger.LogInformation("====================================================================");
        _logger.LogInformation("SOLICITUD DE RECUPERACIÓN DE CONTRASEÑA");
        _logger.LogInformation("CORREO DESTINO: {Correo}", correoDestino);
        _logger.LogInformation("CÓDIGO DE VERIFICACIÓN: {Codigo}", codigo);
        _logger.LogInformation("====================================================================");

        try
        {
            var emailFrom = _config["EMAIL_FROM"] ?? "Soporte <soporte@ie3092kumamoto1.org>";
            var message = new EmailMessage
            {
                From = emailFrom,
                To = { correoDestino },
                Subject = "Recuperación de Contraseña - I.E. 3092 Kumamoto",
                HtmlBody = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='UTF-8'>
                </head>
                <body style='margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif;'>
                    <table border='0' cellpadding='0' cellspacing='0' width='100%' style='padding: 40px 0;'>
                        <tr>
                            <td align='center'>
                                <table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;'>
                                    
                                    <!-- Header / Logo -->
                                    <tr>
                                        <td align='center' style='padding: 40px 0 20px 0; background-color: #ffffff;'>
                                            <h1 style='color: #1e3a8a; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;'>
                                                I.E. 3092 Kumamoto
                                            </h1>
                                        </td>
                                    </tr>
                                    
                                    <!-- Cuerpo del mensaje -->
                                    <tr>
                                        <td style='padding: 20px 40px; color: #4b5563; line-height: 1.6; font-size: 16px; text-align: center;'>
                                            <p>Hola,</p>
                                            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta asociada a <strong>{correoDestino}</strong>.</p>
                                            <p>Ingresa el siguiente código de 6 dígitos en la pantalla de recuperación:</p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Código -->
                                    <tr>
                                        <td align='center' style='padding: 10px 0 30px 0;'>
                                            <div style='background-color: #f8fafc; border: 2px dashed #1e3a8a; padding: 15px 30px; display: inline-block; border-radius: 8px;'>
                                                <span style='font-size: 32px; font-weight: bold; color: #1e3a8a; letter-spacing: 8px;'>{codigo}</span>
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    <!-- Advertencia de seguridad -->
                                    <tr>
                                        <td style='padding: 0 40px 30px 40px; color: #6b7280; line-height: 1.5; font-size: 14px; text-align: center;'>
                                            <p>Este código es seguro y expirará en 15 minutos. Si tú no realizaste esta solicitud, puedes ignorar este correo de forma segura. Tu contraseña actual no cambiará.</p>
                                            <p style='margin-bottom: 0;'>Saludos cordiales,<br>El equipo de soporte de la I.E. 3092 Kumamoto</p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Footer -->
                                    <tr>
                                        <td align='center' style='padding: 20px 40px; background-color: #f9fafb; color: #9ca3af; font-size: 13px; border-top: 1px solid #e5e7eb;'>
                                            &copy; {DateTime.UtcNow.Year} I.E. 3092 Kumamoto. Todos los derechos reservados.
                                        </td>
                                    </tr>
                                    
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>"
            };

            var response = await _resend.EmailSendAsync(message);
            _logger.LogInformation("Correo de recuperación enviado exitosamente vía Resend a {Correo}.", correoDestino);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al enviar el correo de recuperación a {Correo}. El código es {Codigo}.", correoDestino, codigo);
        }
    }

    public async Task EnviarCredencialesAccesoAsync(string correoDestino, string nombres, string contrasenaAsignada, string rol)
    {
        _logger.LogInformation("====================================================================");
        _logger.LogInformation("ENVÍO DE CREDENCIALES DE ACCESO AL REGISTRAR {Rol}", rol.ToUpper());
        _logger.LogInformation("CORREO DESTINO: {Correo}", correoDestino);
        _logger.LogInformation("====================================================================");

        try
        {
            var emailFrom = _config["EMAIL_FROM"] ?? "Soporte <soporte@ie3092kumamoto1.org>";
            var message = new EmailMessage
            {
                From = emailFrom,
                To = { correoDestino },
                Subject = $"Bienvenido al sistema I.E. 3092 Kumamoto - Sus credenciales de {rol}",
                HtmlBody = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='UTF-8'>
                </head>
                <body style='margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif;'>
                    <table border='0' cellpadding='0' cellspacing='0' width='100%' style='padding: 40px 0;'>
                        <tr>
                            <td align='center'>
                                <table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;'>
                                    
                                    <!-- Header / Logo -->
                                    <tr>
                                        <td align='center' style='padding: 40px 0 20px 0; background-color: #ffffff;'>
                                            <h1 style='color: #1e3a8a; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;'>
                                                I.E. 3092 Kumamoto
                                            </h1>
                                        </td>
                                    </tr>
                                    
                                    <!-- Cuerpo del mensaje -->
                                    <tr>
                                        <td style='padding: 20px 40px; color: #4b5563; line-height: 1.6; font-size: 16px;'>
                                            <p>Estimado(a) <strong>{nombres}</strong>,</p>
                                            <p>Su cuenta ha sido creada exitosamente en nuestro sistema escolar con el rol de <strong>{rol}</strong>.</p>
                                            <p>A continuación, le compartimos sus credenciales de acceso iniciales:</p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Credenciales -->
                                    <tr>
                                        <td align='center' style='padding: 10px 40px 30px 40px;'>
                                            <div style='background-color: #f8fafc; border: 2px dashed #1e3a8a; padding: 20px; display: block; border-radius: 8px; text-align: left;'>
                                                <p style='margin: 0 0 10px 0; font-size: 16px; color: #4b5563;'><strong>Usuario/Correo:</strong> {correoDestino}</p>
                                                <p style='margin: 0; font-size: 16px; color: #4b5563;'><strong>Contraseña temporal:</strong> <span style='font-family: monospace; font-size: 18px; color: #1e3a8a; font-weight: bold;'>{contrasenaAsignada}</span></p>
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    <!-- Advertencia de seguridad -->
                                    <tr>
                                        <td style='padding: 0 40px 30px 40px; color: #6b7280; line-height: 1.5; font-size: 14px; text-align: center;'>
                                            <p>Por seguridad, le recomendamos iniciar sesión y cambiar esta contraseña desde la sección ""Mi Perfil"" lo antes posible.</p>
                                            <p style='margin-bottom: 0;'>Saludos cordiales,<br>La Dirección - I.E. 3092 Kumamoto</p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Footer -->
                                    <tr>
                                        <td align='center' style='padding: 20px 40px; background-color: #f9fafb; color: #9ca3af; font-size: 13px; border-top: 1px solid #e5e7eb;'>
                                            &copy; {DateTime.UtcNow.Year} I.E. 3092 Kumamoto. Todos los derechos reservados.
                                        </td>
                                    </tr>
                                    
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>"
            };

            var response = await _resend.EmailSendAsync(message);
            _logger.LogInformation("Credenciales enviadas vía Resend a {Correo}.", correoDestino);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al enviar credenciales a {Correo}.", correoDestino);
        }
    }
}
