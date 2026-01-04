using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReTrackV1.Data;
using ReTrackV1.Models.Entity;

namespace ReTrackV1.Controllers
{
    [ApiController]
    [Route("api/qc")]
    public class QCController : ControllerBase
    {
        private readonly AppDbContext _context;

        public QCController(AppDbContext context)
        {
            _context = context;
        }

        // ----------------------------------------------------
        // GET ALL QC REPORTS  (Dashboard)
        // ----------------------------------------------------
        [HttpGet("reports")]
        public async Task<IActionResult> GetReports()
        {
            var reports = await _context.QCReports
                .OrderByDescending(r => r.InspectionDate)
                .ToListAsync();

            return Ok(reports);
        }

        // ----------------------------------------------------
        // GET PRODUCT BY ID  (QC Control Page)
        // ----------------------------------------------------
        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetProduct(string productId)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.ProductID == productId);

            if (product == null)
                return NotFound(new { message = "Product not found" });

            return Ok(product);
        }

        // ----------------------------------------------------
        // GET PRODUCT BY ID FROM QC TASKS (Validation)
        // ----------------------------------------------------
        [HttpGet("task-product/{productId}")]
        public async Task<IActionResult> GetProductFromTasks(string productId)
        {
            var qcTask = await _context.QCTasks
                .FirstOrDefaultAsync(t => t.ProductId == productId);

            if (qcTask == null)
            {
                return NotFound(new
                {
                    message = $"Product {productId} not assigned for QC."
                });
            }

            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.ProductID == productId);

            if (product == null)
            {
                return StatusCode(500, new
                {
                    message = "Product details missing for assigned task."
                });
            }

            return Ok(product);
        }

        // ----------------------------------------------------
        // GET ALL QC TASKS (FOR PRODUCT ID DROPDOWN)
        // ----------------------------------------------------
        [HttpGet("tasks")]
        public async Task<IActionResult> GetQCTasks()
        {
            var tasks = await _context.QCTasks
                .Where(t => t.Status == "Pending")   // keeps dropdown clean
                .Select(t => new
                {
                    taskId = t.Id,
                    productId = t.ProductId,
                    status = t.Status
                })
                .ToListAsync();

            return Ok(tasks);
        }

        // ----------------------------------------------------
        // CREATE QC REPORT (Submit)
        // ----------------------------------------------------
        [HttpPost("report")]
        public async Task<IActionResult> CreateReport([FromBody] QCReport report)
        {
            if (report == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid report data received."
                });
            }

            // Ensure CreatedAt is set
            report.CreatedAt = DateTime.UtcNow;

            _context.QCReports.Add(report);
            await _context.SaveChangesAsync();

            // ----------------------------------------------------
            // NOTIFICATION FOR WAREHOUSE STAFF
            // ----------------------------------------------------
            var warehouseNotification = new Notification
            {
                UserRole = "Warehouse",
                Title = "QC Inspection Completed",
                Message = $"QC inspection completed for Product {report.ProductID}",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(warehouseNotification);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Report saved successfully",
                reportId = report.ReportID
            });
        }

        // GET: api/qc/report/{id}
        [HttpGet("report/{id}")]
        public IActionResult GetReportById(string id)
        {
            // Assuming your table is called 'QCReports' and the column is 'ProductID'
            var report = _context.QCReports
                .FirstOrDefault(r => r.ProductID == id);

            if (report == null)
            {
                return NotFound(new { message = $"Report with ID {id} not found." });
            }

            return Ok(report);
        }
    }
}