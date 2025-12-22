using Microsoft.AspNetCore.Mvc;
using ReTrackV1.Data;
using ReTrackV1.Models.DTO;
using ReTrackV1.Models.Entity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ReTrackV1.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext DbContext;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext dbContext, IConfiguration config)
        {
            DbContext = dbContext;
            _config = config;
        }

        // ─────────────────────────────────────────────
        // REGISTER
        // ─────────────────────────────────────────────
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromForm] AddUserDto addUserDto)
        {
            string uploadRoot = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
            if (!Directory.Exists(uploadRoot))
                Directory.CreateDirectory(uploadRoot);

            // Identity document (required)
            string identityFileName = $"{Guid.NewGuid()}_{addUserDto.IdentityDocPath.FileName}";
            string identityPath = Path.Combine(uploadRoot, identityFileName);

            using (var stream = new FileStream(identityPath, FileMode.Create))
                await addUserDto.IdentityDocPath.CopyToAsync(stream);

            string identityDbPath = $"/uploads/{identityFileName}";

            // QC certificate (optional)
            string? qcDbPath = null;
            if (addUserDto.QCCertificatePath != null)
            {
                string qcFileName = $"{Guid.NewGuid()}_{addUserDto.QCCertificatePath.FileName}";
                string qcPath = Path.Combine(uploadRoot, qcFileName);

                using (var stream = new FileStream(qcPath, FileMode.Create))
                    await addUserDto.QCCertificatePath.CopyToAsync(stream);

                qcDbPath = $"/uploads/{qcFileName}";
            }

            var userEntity = new User
            {
                Name = addUserDto.Name,
                DOB = addUserDto.DOB,
                State = addUserDto.State,
                City = addUserDto.City,
                Address = addUserDto.Address,
                Phone = addUserDto.Phone,
                Email = addUserDto.Email,

                // password assigned after approval
                PasswordHash = null,

                IdentityDocPath = identityDbPath,
                QCCertificatePath = qcDbPath,

                Role = addUserDto.Role,
                Shift = addUserDto.Shift,
                WarehouseId = addUserDto.WarehouseId,

                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            DbContext.Users.Add(userEntity);
            await DbContext.SaveChangesAsync();

            return Ok(new
            {
                message = "Registration successful",
                id = userEntity.Id
            });
        }

        // ─────────────────────────────────────────────
        // LOGIN
        // ─────────────────────────────────────────────
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto dto)
        {
            var user = DbContext.Users.FirstOrDefault(u =>
                u.UserId == dto.UserId &&
                u.PasswordHash == dto.Password
            );

            if (user == null)
                return Unauthorized(new { message = "Invalid credentials" });

            // ROLE CHECK
            if (!string.Equals(user.Role, dto.Role, StringComparison.OrdinalIgnoreCase))
                return Unauthorized(new { message = "Role mismatch" });

            // PREFIX VALIDATION
            switch (user.Role)
            {
                case "PickupAgent":
                    if (!user.UserId.StartsWith("PA"))
                        return Unauthorized(new { message = "PickupAgent ID must start with PA" });
                    break;

                case "QCStaff":
                    if (!(user.UserId.StartsWith("QCA") || user.UserId.StartsWith("QA")))
                        return Unauthorized(new { message = "QC ID must start with QCA or QA" });
                    break;

                case "WarehouseStaff":
                    if (!user.UserId.StartsWith("WA"))
                        return Unauthorized(new { message = "Warehouse ID must start with WA" });
                    break;

                case "Admin":
                    if (!user.UserId.StartsWith("AA"))
                        return Unauthorized(new { message = "Admin ID must start with AA" });
                    break;
            }

            var claims = new[]
            {
                new Claim("id", user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("city", user.City ?? ""),
                new Claim("state", user.State ?? "")
            };
            var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY")?? throw new Exception("JWT_KEY not set");

            var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "ReTrack";
            var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "ReTrackUsers";
            var jwtExpiry = Convert.ToDouble(
                Environment.GetEnvironmentVariable("JWT_EXPIRY_MINUTES") ?? "60"
            );

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            );

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(jwtExpiry),
                signingCredentials: creds
            );


            return Ok(new
            {
                message = "Login successful",
                token = new JwtSecurityTokenHandler().WriteToken(token),
                user = new
                {
                    user.Id,
                    user.UserId,
                    user.Name,
                    user.Role,
                    user.City,
                    user.State
                }
            });
        }
    }
}
