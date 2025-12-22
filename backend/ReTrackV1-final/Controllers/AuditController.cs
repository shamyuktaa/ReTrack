using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReTrackV1.Data;
using ReTrackV1.Models.Entity;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ReTrackV1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuditController : ControllerBase
    {
        private readonly AppDbContext _db;
        public AuditController(AppDbContext db) => _db = db;

        // GET: api/auditlogs?limit=50
        [HttpGet("auditlogs")]
        public async Task<IActionResult> GetAuditLogs([FromQuery] int limit = 50, [FromQuery] int? userId = null)
        {
            if (limit <= 0) limit = 50;
            if (limit > 1000) limit = 1000;

            var query = _db.AuditLogs.AsQueryable();

            if (userId.HasValue)
            {
                query = query.Where(a => a.PerformedByUserId == userId.Value);
            }

            var rows = await query
                .OrderByDescending(a => a.CreatedAt)
                .Take(limit)
                .Select(a => new
                {
                    a.AuditLogId,
                    a.Entity,
                    a.EntityId,
                    a.Action,
                    a.Details,
                    a.PerformedByUserId,
                    a.CreatedAt
                })
                .ToListAsync();

            return Ok(rows);
        }

        // OPTIONAL: GET single audit log
        // GET: api/auditlogs/{id}
        [HttpGet("auditlogs/{id:int}")]
        public async Task<IActionResult> GetAuditLog(int id)
        {
            var log = await _db.AuditLogs.FirstOrDefaultAsync(a => a.AuditLogId == id);
            if (log == null) return NotFound(new { message = "Audit log not found" });

            return Ok(new
            {
                log.AuditLogId,
                log.Entity,
                log.EntityId,
                log.Action,
                log.Details,
                log.PerformedByUserId,
                log.CreatedAt
            });
        }
    }
}
