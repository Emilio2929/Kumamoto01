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
using Resend;

var builder = WebApplication.CreateBuilder(args);

// ── 1. FAIL-FAST: Verificación estricta de Entorno ──────────────────────────
var env = builder.Environment;
string GetRequiredEnv(string key)
{
    var val = Environment.GetEnvironmentVariable(key) ?? builder.Configuration[key];
    if (string.IsNullOrWhiteSpace(val) && env.IsProduction())
        throw new InvalidOperationException($"CRÍTICO: Variable de entorno '{key}' no configurada.");
    return val ?? "DEVELOPMENT_FALLBACK"; // Solo para que compile en dev si falta
}

var dbUrl = GetRequiredEnv("DATABASE_URL");
if (dbUrl == "DEVELOPMENT_FALLBACK" || dbUrl == "TuConnectionDeSupabase" || !dbUrl.Contains('=')) 
    dbUrl = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Host=localhost;Database=postgres;Username=postgres;Password=postgres";

var jwtSecret = GetRequiredEnv("JWT_SECRET");
if (jwtSecret == "DEVELOPMENT_FALLBACK" || jwtSecret == "TuClaveSuperSecretaLargaDeAlMenos32Caracteres!") 
    jwtSecret = builder.Configuration["Jwt:Key"] ?? "clavesupersecretadekumamotodevelopment123";

var corsOrigins = GetRequiredEnv("CORS_ALLOWED_ORIGINS");
if (corsOrigins == "DEVELOPMENT_FALLBACK" || !corsOrigins.Contains("http")) 
    corsOrigins = "http://localhost:4200, https://ie3092kumamoto1.org";

var resendApiKey = GetRequiredEnv("RESEND_API_KEY");
var emailFrom = GetRequiredEnv("EMAIL_FROM");
var jwtExpMinStr = GetRequiredEnv("JWT_EXPIRATION_MINUTES");
if (!int.TryParse(jwtExpMinStr, out int jwtExpirationMinutes)) jwtExpirationMinutes = 20;

// ── 2. Rate Limiting Estricto (Fuerza Bruta) ───────────────────────────────
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("LoginPolicy", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0; // Sin cola, rechazo inmediato
    });
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// ── 3. Configuración JSON e Inyección ──────────────────────────────────────
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ── 4. CORS Restrictivo ────────────────────────────────────────────────────
builder.Services.AddCors(options =>
    options.AddPolicy("StrictCorsPolicy", p =>
    {
        var allowedList = corsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(o => o.Trim()).ToArray();
        p.SetIsOriginAllowed(origin => 
            allowedList.Contains(origin, StringComparer.OrdinalIgnoreCase) ||
            origin.StartsWith("http://localhost") ||
            origin.EndsWith(".vercel.app") ||
            origin.EndsWith(".trycloudflare.com"))
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials(); // Obligatorio para Cookies HttpOnly
    }));

// ── 5. Base de Datos ───────────────────────────────────────────────────────
builder.Services.AddDbContext<KumamotoDbContext>(options =>
    options.UseNpgsql(dbUrl).UseSnakeCaseNamingConvention());

// ── 6. JWT Leyendo desde Cookies ───────────────────────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "kumamoto-api",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "kumamoto-frontend",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero // Expiración exacta
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // Extraer JWT de la Cookie en lugar del Header Bearer
                if (context.Request.Cookies.TryGetValue("kumamoto_jwt", out var token))
                {
                    context.Token = token;
                }
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();

// ── 7. Servicios Propios y Resend ──────────────────────────────────────────
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<RiesgoService>();
builder.Services.AddScoped<EarlyWarningService>();
builder.Services.AddScoped<AlertaTempranaService>();
builder.Services.AddScoped<EmailService>();
builder.Services.Configure<ResendClientOptions>(o => o.ApiToken = resendApiKey);
builder.Services.AddHttpClient<IResend, ResendClient>();

// ──────────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── 8. Exception Handling Middleware (Silencioso en Prod) ──────────────────
if (app.Environment.IsProduction())
{
    app.UseExceptionHandler(errorApp =>
    {
        errorApp.Run(async context =>
        {
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { mensaje = "Internal Server Error" });
        });
    });
}

// ── 9. Security Headers ────────────────────────────────────────────────────
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Content-Security-Policy", "frame-ancestors 'none'");
    await next();
});

// ── 10. Sliding Expiration Middleware ──────────────────────────────────────
app.Use(async (context, next) =>
{
    await next();
    // Refrescar el token y la cookie si está autenticado y activo
    if (context.User.Identity?.IsAuthenticated == true && context.Response.StatusCode != 401)
    {
        // En una app más compleja, aquí se genera un nuevo JWT si está por vencer y se reinyecta en la Cookie.
    }
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("StrictCorsPolicy");
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
