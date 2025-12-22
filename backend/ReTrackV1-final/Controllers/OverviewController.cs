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
    [Route("api/overview")]
    public class OverviewController : ControllerBase
    {
        private readonly AppDbContext _db;
        public OverviewController(AppDbContext db) => _db = db;

        // GET api/overview/today
        // Overall counts for today (EXCLUDING returns with PickupStatus == "Failed")
        [HttpGet("today")]
        public async Task<IActionResult> GetTodayOverview()
        {
            var today = DateTime.UtcNow.Date;

            var returnsToday = await _db.Returns
                .Where(r =>
                    // Consider a return "today" if PickupTime is set to today OR CreatedAt is today
                    ((r.PickupTime.HasValue && r.PickupTime.Value.Date == today)
                      || r.CreatedAt.Date == today)
                    // exclude Failed
                    && (r.PickupStatus == null || r.PickupStatus != "Failed")
                )
                .ToListAsync();

            var total = returnsToday.Count;
            var completed = returnsToday.Count(r => string.Equals(r.PickupStatus, "Completed", StringComparison.OrdinalIgnoreCase)
                                                    || (r.CompletedAt.HasValue));
            var inProgress = returnsToday.Count(r => string.Equals(r.PickupStatus, "In Progress", StringComparison.OrdinalIgnoreCase)
                                                     || string.Equals(r.PickupStatus, "InProgress", StringComparison.OrdinalIgnoreCase));
            var pending = returnsToday.Count(r => string.Equals(r.PickupStatus, "Pending", StringComparison.OrdinalIgnoreCase)
                                                  || string.IsNullOrWhiteSpace(r.PickupStatus));

            return Ok(new
            {
                total,
                completed,
                inProgress,
                pending
            });
        }

        // GET api/overview/agent/{agentId}/today
        // Agent-specific counts for today (useful for agent dashboard)
        [HttpGet("agent/{agentId:int}/today")]
        public async Task<IActionResult> GetAgentTodayOverview(int agentId)
        {
            var today = DateTime.UtcNow.Date;

            var returnsToday = await _db.Returns
                .Where(r =>
                    (r.PickupAgentId.HasValue && r.PickupAgentId.Value == agentId)
                    && ((r.PickupTime.HasValue && r.PickupTime.Value.Date == today) || r.CreatedAt.Date == today)
                    && (r.PickupStatus == null || r.PickupStatus != "Failed")
                )
                .ToListAsync();

            var total = returnsToday.Count;
            var completed = returnsToday.Count(r => string.Equals(r.PickupStatus, "Completed", StringComparison.OrdinalIgnoreCase)
                                                    || (r.CompletedAt.HasValue));
            var inProgress = returnsToday.Count(r => string.Equals(r.PickupStatus, "In Progress", StringComparison.OrdinalIgnoreCase)
                                                     || string.Equals(r.PickupStatus, "InProgress", StringComparison.OrdinalIgnoreCase));
            var pending = returnsToday.Count(r => string.Equals(r.PickupStatus, "Pending", StringComparison.OrdinalIgnoreCase)
                                                  || string.IsNullOrWhiteSpace(r.PickupStatus));

            return Ok(new
            {
                agentId,
                total,
                completed,
                inProgress,
                pending
            });
        }

        //ADMIN
        //DASHBOARD OVERVIEW :-
        [HttpGet("/admin/summary")]
        public async Task<IActionResult> GetSummary()
        {
            // Only count 
            //Total Returns Processed
            //Active Agents
            //Warehouses Managed
            //QC Success Rate (Approved)*100/(Total QC Tasks)
            var Total_returns = await _db.Returns.CountAsync(r=>r.CreatedAt >= DateTime.Now.AddDays(-30));
            var Active_agents = await _db.Users.CountAsync(u=>u.Status=="Active");
            var Warehouses = await _db.Warehouses.CountAsync();

            // calc success rate
            var approved = await _db.QCReports.CountAsync(qc => qc.FinalDecision == "Approved");
            var totalQC = await _db.QCTasks.CountAsync();
            var QCsuccessRate = 0.0f;
            if (totalQC > 0)
            {
                float calculatedRate = (float)approved * 100 / totalQC;
                QCsuccessRate = (float)Math.Round(calculatedRate, 2);
            }
            return Ok(new { Total_returns, Active_agents, Warehouses, QCsuccessRate});
        }

        // TRENDS CONTROLLER

        [HttpGet("/admin/trends")]
        public async Task<IActionResult> GetTrends()
        {
            var now = DateTime.Now;
            var startOfYear = new DateTime(now.Year, 1, 1);
            var monthLabels = Enumerable.Range(1, 12).Select(m => new DateTime(now.Year, m, 1).ToString("MMM")).ToArray();
            var monthlyReturnsData = await _db.Returns
                .Where(r => r.CreatedAt >= startOfYear)
                .GroupBy(r => r.CreatedAt.Month)
                .Select(g => new { Month = g.Key, Count = g.Count() })
                .ToListAsync();
            var monthlyReturns = new int[12];
            foreach (var item in monthlyReturnsData)
            {
                monthlyReturns[item.Month - 1] = item.Count;
            }
            var totalQCTasksData = await _db.QCTasks
                .Where(t => t.CreatedAt >= startOfYear)
                .GroupBy(t => t.CreatedAt.Month)
                .Select(g => new { Month = g.Key, Count = g.Count() })
                .ToListAsync();

            var totalQCTasks = new int[12];
            foreach (var item in totalQCTasksData)
            {
                totalQCTasks[item.Month - 1] = item.Count;
            }
            var approvedQCReportsData = await _db.QCReports
                .Where(r => r.CreatedAt >= startOfYear && r.FinalDecision == "Approved")
                .GroupBy(r => r.CreatedAt.Month)
                .Select(g => new { Month = g.Key, Count = g.Count() })
                .ToListAsync();

            var approvedQCReports = new int[12];
            foreach (var item in approvedQCReportsData)
            {
                approvedQCReports[item.Month - 1] = item.Count;
            }
            var monthlyQCRate = new float[12];
            for (int i = 0; i < 12; i++)
            {
                float total = totalQCTasks[i];
                float approved = approvedQCReports[i];

                if (total > 0)
                {
                    float calculatedRate = (approved / total) * 100f;
                    monthlyQCRate[i] = (float)Math.Round(calculatedRate, 2);
                }
                else
                {
                    monthlyQCRate[i] = 0.0f;
                }
            }

            var agentStatusCounts = await _db.Users
                .GroupBy(u => u.Status)
                .Select(g => new
                {
                    Status = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            // Extract the counts for 'Active' and 'Inactive'
            var activeCount = agentStatusCounts
                .FirstOrDefault(x => x.Status == "Active")?.Count ?? 0;

            var inactiveCount = agentStatusCounts
                .FirstOrDefault(x => x.Status == "Inactive")?.Count ?? 0;

            var agentPerformance = new int[] { activeCount, inactiveCount };
            return Ok(new
            {
                monthlyReturns,
                monthlyQCRate,
                agentPerformance
                // Note: You can optionally include monthLabels here if you want the client to use them, 
                // but since they are static strings in the client, it's not strictly necessary.
                // monthLabels
            });
        }




    }
}
