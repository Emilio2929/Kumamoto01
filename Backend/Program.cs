using System.Text;
using System.Text.Json.Serialization;
using Kumamoto.API.Data;
using Kumamoto.API.Endpoints;
using Kumamoto.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// ── JSON Configuration ──────────────────────────────────────────────────────
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// ── Swagger ────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ── Rate Limiting (Protección Fuerza Bruta) ────────────────────────────────
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("LoginLimiter", opt =>
    {
        opt.PermitLimit = 5; // Máximo 5 intentos
        opt.Window = TimeSpan.FromMinutes(1); // por minuto
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 2;
    });
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// ── CORS ───────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
    options.AddPolicy("FrontendPolicy", p =>
        p.SetIsOriginAllowed(origin => 
            origin.StartsWith("http://localhost") || 
            origin.EndsWith(".trycloudflare.com") ||
            origin.EndsWith(".vercel.app") ||
            (builder.Configuration["AllowedOrigins"] != null && builder.Configuration["AllowedOrigins"]!.Split(',').Any(o => origin.Equals(o.Trim(), StringComparison.OrdinalIgnoreCase))))
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials()));

// ── PostgreSQL + EF Core ───────────────────────────────────────────────────
builder.Services.AddDbContext<KumamotoDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());   // grado_id, clave_hash, etc.

// ── JWT ────────────────────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization();

// ── Servicios propios ──────────────────────────────────────────────────────
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<RiesgoService>();
builder.Services.AddScoped<EarlyWarningService>();
builder.Services.AddScoped<AlertaTempranaService>();
builder.Services.AddScoped<EmailService>();

// ──────────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Cabeceras de Seguridad HTTP (Security Headers) ─────────────────────────
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Content-Security-Policy", "frame-ancestors 'none'");
    await next();
});

// Migración automática desactivada por preferencia del usuario (gestión manual de base de datos)

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection(); // Deshabilitado en dev para evitar problemas de CORS
app.UseCors("FrontendPolicy");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// ── Endpoints ──────────────────────────────────────────────────────────────
app.MapAuthEndpoints();
app.MapAulasEndpoints();
app.MapDashboardEndpoints();
app.MapGradosSeccionesEndpoints();
app.MapCursosEndpoints();
app.MapPadresEndpoints();
app.MapMatriculaEndpoints();
app.MapDocentesEndpoints();
app.MapCargaAcademicaEndpoints();
app.MapAuxiliarEndpoints();
app.MapAuxiliaresAdminEndpoints();
app.MapAsignacionAuxiliarEndpoints();
app.MapIncidenciasEndpoints();
app.MapCalificacionesEndpoints();
app.MapDocentePortalEndpoints();
app.MapAuxiliarPortalEndpoints();
app.MapAdministrativosEndpoints();
app.MapComunicadoEndpoints();
app.MapDesbloqueoNotasEndpoints();
app.MapNotificacionesEndpoints();
app.MapConfiguracionAnioEndpoints();

app.Run();
