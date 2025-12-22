using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReTrackV1.Data;
using ReTrackV1.Models.DTO;
using ReTrackV1.Models.Entity;

[ApiController]
[Route("api/[controller]")]
public class IssueReportsController : ControllerBase
{
    private readonly AppDbContext _db;

    public IssueReportsController(AppDbContext db)
    {
        _db = db;
    }

    // --------------
    // AUTO ID METHOD
    // --------------
    private async Task<string> GenerateIssueIdAsync()
    {
        var lastIssue = await _db.IssueReports
            .OrderByDescending(i => i.Id) // primary key auto-increment
            .FirstOrDefaultAsync();

        if (lastIssue == null || string.IsNullOrEmpty(lastIssue.IssueID))
            return "ISS001";

        string lastId = lastIssue.IssueID.Replace("ISS", ""); // extract number
        int num = int.Parse(lastId) + 1;

        return "ISS" + num.ToString("D3"); // padded to 3 digits -> ISS005
    }

    // 1️⃣ Get all issues
    [HttpGet]
    public async Task<IActionResult> GetIssues()
    {
        var issues = await _db.IssueReports
            .Include(i => i.Bag)
            .Include(i => i.Return)
            .ToListAsync();

        return Ok(issues);
    }

    // 2️⃣ Create issue
    [HttpPost]
    public async Task<IActionResult> CreateIssue(CreateIssueReportDto dto)
    {
        string newIssueId = await GenerateIssueIdAsync();

        var report = new IssueReport
        {
            IssueID = newIssueId,     // ← AUTO GENERATED ID HERE
            BagId = dto.BagId,
            ReturnId = dto.ReturnId,
            Notes = dto.Notes,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _db.IssueReports.Add(report);
        await _db.SaveChangesAsync();

        return Ok(report);
    }

    // 3️⃣ Update issue status
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateIssueStatus(int id, [FromBody] string status)
    {
        var issue = await _db.IssueReports.FindAsync(id);
        if (issue == null) return NotFound();

        issue.Status = status;
        issue.ResolvedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(issue);
    }
}
