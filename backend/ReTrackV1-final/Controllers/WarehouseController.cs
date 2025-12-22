using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReTrackV1.Data;
using ReTrackV1.Models.Entity;

[ApiController]
[Route("api/[controller]")]
public class WarehouseController : ControllerBase
{
    private readonly AppDbContext _db;

    public WarehouseController(AppDbContext db)
    {
        _db = db;
    }

    // ---------------------------------------------------
    // GET WAREHOUSE DETAILS
    // ---------------------------------------------------
    [HttpGet("{id}")]
    public async Task<IActionResult> GetWarehouse(int id)
    {
        var warehouse = await _db.Warehouses
            .Include(w => w.Staff)
            .Include(w => w.Bags)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (warehouse == null)
            return NotFound();

        return Ok(warehouse);
    }

    // ---------------------------------------------------
    // FORWARD BAG ITEMS TO QC
    // ---------------------------------------------------
    [HttpPost("forward-to-qc/{bagId}")]
    public async Task<IActionResult> ForwardToQC(int bagId)
    {
        // 1. Load Bag
        var bag = await _db.Bags
            .FirstOrDefaultAsync(b => b.Id == bagId);

        if (bag == null)
            return NotFound(new { message = "Bag not found" });

        // 2. Fetch eligible items (Status = Proceed)
        var eligibleItemsDetails = await _db.BagItems
            .Where(bi => bi.BagId == bagId && bi.Status == "Proceed")
            .Join(
                _db.Returns,
                bi => bi.ReturnId,
                r => r.Id,
                (bi, r) => new { bi, r }
            )
            .Join(
                _db.Products,
                joined => joined.r.ProductId,
                p => p.Id,
                (joined, p) => new
                {
                    ReturnId = joined.r.Id,
                    ProductId = p.Id,
                    ProductCode = p.ProductID,
                    ProductName = p.Name,
                    ProductType = p.Type
                }
            )
            .ToListAsync();

        if (!eligibleItemsDetails.Any())
            return BadRequest(new { message = "No eligible items to forward to QC" });

        // 3. Convert to QC Tasks
        var qcTasks = eligibleItemsDetails.Select(item => new QCTask
        {
            ReturnId = item.ReturnId,
            ProductId = item.ProductCode,   // Using ProductCode as ProductId
            ProductName = item.ProductName,
            ProductType = item.ProductType,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        }).ToList();

        // 4. Save QC tasks
        await _db.QCTasks.AddRangeAsync(qcTasks);
        await _db.SaveChangesAsync();

        // ---------------------------------------------------
        // 🔔 CREATE NOTIFICATION FOR QC STAFF (HERE)
        // ---------------------------------------------------
        var qcNotification = new Notification
        {
            UserRole = "QC",
            Title = "Items Forwarded to QC",
            Message = $"Bag {bagId} has {qcTasks.Count} item(s) pending QC inspection",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _db.Notifications.AddAsync(qcNotification);
        await _db.SaveChangesAsync();

        // 5. Response
        return Ok(new
        {
            message = "Items successfully forwarded to QC",
            forwardedCount = qcTasks.Count
        });
    }
}