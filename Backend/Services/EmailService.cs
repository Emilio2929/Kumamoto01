using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Kumamoto.API.Services;

public class EmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
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
            var host = _configuration["Smtp:Host"];
            var portStr = _configuration["Smtp:Port"];
            var user = _configuration["Smtp:Username"];
            var pass = _configuration["Smtp:Password"];

            if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(user) || string.IsNullOrEmpty(pass))
            {
                _logger.LogWarning("Configuración SMTP no provista o en modo desarrollo. El código {Codigo} se muestra arriba para pruebas locales.", codigo);
                return;
            }

            int port = int.TryParse(portStr, out var p) ? p : 587;

            using var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(user, pass),
                EnableSsl = _configuration.GetValue<bool>("Smtp:EnableSsl", true)
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(user, "Colegio Kumamoto - Soporte"),
                Subject = "Código de Recuperación de Contraseña",
                Body = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;'>
    <h2 style='color: #1e3a8a; text-align: center;'>Colegio Kumamoto</h2>
    <p style='color: #334155; font-size: 16px;'>Hola,</p>
    <p style='color: #334155; font-size: 16px;'>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta asociada a <b>{correoDestino}</b>.</p>
    <div style='background-color: #f8fafc; border-left: 4px solid #1e3a8a; padding: 15px; margin: 20px 0; text-align: center;'>
        <span style='font-size: 28px; font-weight: bold; color: #1e3a8a; letter-spacing: 5px;'>{codigo}</span>
    </div>
    <p style='color: #64748b; font-size: 14px;'>Este código expirará en 15 minutos.</p>
    <p style='color: #64748b; font-size: 14px;'>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
    <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;' />
    <p style='color: #94a3b8; font-size: 12px; text-align: center;'>© 2026 Colegio Kumamoto. Todos los derechos reservados.</p>
</div>",
                IsBodyHtml = true
            };

            mailMessage.To.Add(correoDestino);

            await client.SendMailAsync(mailMessage);
            _logger.LogInformation("Correo de recuperación enviado exitosamente a {Correo}", correoDestino);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al enviar el correo de recuperación a {Correo}. El código es {Codigo}.", correoDestino, codigo);
        }
    }
}
