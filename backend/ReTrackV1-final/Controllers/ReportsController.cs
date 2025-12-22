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
    [Route("api/agent/reports")]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public ReportsController(AppDbContext db) => _db = db;

        // POST: api/agent/reports
        // Body: { ReturnCode, ReturnId, AgentId, IssueType, Notes, OccurredAt (optional ISO) }
        [HttpPost]
        public async Task<IActionResult> CreateReport([FromBody] Report input)
        {
            if (input == null) return BadRequest(new { message = "Invalid payload" });

            // normalize minimal fields
            if (string.IsNullOrWhiteSpace(input.IssueType)) input.IssueType = "General";
            if (input.OccurredAt == default) input.OccurredAt = DateTime.UtcNow;
            input.CreatedAt = DateTime.UtcNow;
            input.ReturnCode ??= string.Empty;
            input.Notes ??= string.Empty;

            // Try to find matching return:
            // - If numeric ReturnId supplied -> lookup by ReturnId
            // - Else if ReturnCode supplied -> lookup by ExternalReturnCode
            Returns matchedReturn = null;

            if (input.ReturnId.HasValue)
            {
                matchedReturn = await _db.Returns.FirstOrDefaultAsync(r => r.Id == input.ReturnId.Value);
            }

            if (matchedReturn == null && !string.IsNullOrWhiteSpace(input.ReturnCode))
            {
                matchedReturn = await _db.Returns.FirstOrDefaultAsync(r => r.ReturnCode == input.ReturnCode);
            }

            // fallback: try either match if both provided but previous lookups failed
            if (matchedReturn == null && (input.ReturnId.HasValue || !string.IsNullOrWhiteSpace(input.ReturnCode)))
            {
                matchedReturn = await _db.Returns.FirstOrDefaultAsync(r =>
                    (input.ReturnId.HasValue && r.Id == input.ReturnId.Value)
                    || (!string.IsNullOrWhiteSpace(input.ReturnCode) && r.ReturnCode == input.ReturnCode));
            }

            // Add report to DB (will get ReportId after SaveChanges)
            _db.Reports.Add(input);

            if (matchedReturn != null)
            {
                // Determine new status: Pending only for "Customer not available", otherwise Failed
                var isCustomerNotAvailable = input.IssueType?.Trim().Equals("Customer not available", StringComparison.OrdinalIgnoreCase) == true;

                matchedReturn.PickupStatus = isCustomerNotAvailable ? "Pending" : "Failed";

                // Optionally update a timestamp field - we have PickupTime / CompletedAt; use PickupTime as last activity
                try
                {
                    matchedReturn.PickupTime = DateTime.UtcNow;
                }
                catch
                {
                    // ignore if this model doesn't permit assignment (should be fine)
                }

                await _db.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    reportId = input.ReportId,
                    updatedReturnId = matchedReturn.Id,
                    updatedExternalCode = matchedReturn.ReturnCode,
                    newStatus = matchedReturn.PickupStatus
                });
            }
            else
            {
                // no matching return found — still save the report
                await _db.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    reportId = input.ReportId,
                    warning = "No matching Return found for provided ReturnId/ReturnCode. Report stored but no return status updated."
                });
            }
        }

        // GET: api/agent/reports  (admin use)
        [HttpGet]
        public async Task<IActionResult> List([FromQuery] int? agentId = null, [FromQuery] int top = 100)
        {
            var q = _db.Reports.AsQueryable();

            if (agentId.HasValue)
                q = q.Where(r => r.AgentId == agentId.Value);

            var list = await q.OrderByDescending(r => r.CreatedAt).Take(top).ToListAsync();
            return Ok(list);
        }

        // GET: api/agent/reports/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> Get(int id)
        {
            var r = await _db.Reports.FirstOrDefaultAsync(x => x.ReportId == id);
            if (r == null) return NotFound();
            return Ok(r);
        }
    }
}
