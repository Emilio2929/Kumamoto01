using System.Text;
using System.Text.Json.Serialization;
using Kumamoto.API.Data;
using Kumamoto.API.Endpoints;
using Kumamoto.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ── JSON Configuration ──────────────────────────────────────────────────────
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// ── Swagger ────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ── CORS ───────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
    options.AddPolicy("FrontendPolicy", p =>
        p.SetIsOriginAllowed(origin => 
            origin.StartsWith("http://localhost") || 
            origin.EndsWith(".trycloudflare.com"))
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

// ──────────────────────────────────────────────────────────────────────────
var app = builder.Build();

// Migración automática desactivada por preferencia del usuario (gestión manual de base de datos)

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection(); // Deshabilitado en dev para evitar problemas de CORS
app.UseCors("FrontendPolicy");
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
