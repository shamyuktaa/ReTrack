using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using ReTrackV1.Data;
using ReTrackV1.Hubs;
using ReTrackV1.Services;
using System.Text;

if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
{
    DotNetEnv.Env.Load();
}

var builder = WebApplication.CreateBuilder(args);

/* ————————————— CONFIG ————————————— */

string jwtKey = Environment.GetEnvironmentVariable("JWT_KEY")
    ?? throw new Exception("JWT_KEY is missing");

string jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "ReTrack";
string jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "ReTrackUsers";

// FIX: Ensure this matches your frontend port exactly (e.g., http://localhost:5173 or 3000)
string frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:3000";

string connectionString =
    Environment.GetEnvironmentVariable("DB_CONNECTION")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new Exception("Database connection missing");

/* ————————————— SERVICES ————————————— */

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddScoped<AnomalyDetectionService>();
builder.Services.AddSignalR();

/* --------------- EMAIL -------------- */
builder.Services.AddScoped<EmailService>();


/* ————————————— AUTH ————————————— */

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey))
    };
});

/* ————————————— CORS ————————————— */

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(frontendUrl)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required for SignalR
    });
});

var app = builder.Build();

/* ————————————— MIDDLEWARE ————————————— */

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// IMPORTANT: UseCors must be called after UseRouting (implicit here) 
// but before UseAuthentication and UseAuthorization.
app.UseRouting();

app.UseCors("AllowFrontend");

// Move HttpsRedirection AFTER Cors to avoid preflight redirect issues in some browsers
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

/* ————————————— STATIC FILES ————————————— */

app.UseStaticFiles();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "Uploads")),
    RequestPath = "/uploads"
});

app.MapControllers();
app.MapHub<NotificationHub>("/notificationHub");

app.Run();