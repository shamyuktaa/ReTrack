using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReTrackV1.Data;
using ReTrackV1.Models.Entity;

[ApiController]
[Route("api/[controller]")]
public class BagsController : ControllerBase
{
    private readonly AppDbContext _db;

    public BagsController(AppDbContext db)
    {
        _db = db;
    }

    // 0️⃣ Get all bags (for dropdown list)
    [HttpGet]
    public async Task<IActionResult> GetAllBags()
    {
        var bags = await _db.Bags
            .Select(b => new {
                b.Id,
                b.BagCode,
                b.Status
            })
            .ToListAsync();

        return Ok(bags);
    }

    // 1️⃣ Get a bag + items + returns
    [HttpGet("{id}")]
    public async Task<IActionResult> GetBag(int id)
    {
        var bag = await _db.Bags
            .Include(b => b.Items)
                .ThenInclude(i => i.Return)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (bag == null) return NotFound();

        return Ok(bag);
    }

    // 2️⃣ Create Bag
    [HttpPost]
    public async Task<IActionResult> CreateBag(Bags bag)
    {
        _db.Bags.Add(bag);
        await _db.SaveChangesAsync();
        return Ok(bag);
    }

    // 3️⃣ Seal Bag
    [HttpPut("{id}/seal")]
    public async Task<IActionResult> SealBag(int id)
    {
        var bag = await _db.Bags.FindAsync(id);
        if (bag == null) return NotFound();

        bag.Status = "Sealed";
        bag.SealIntegrity = "Intact";
        bag.SealedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(bag);
    }

    // 4️⃣ Empty Bag (Warehouse operation)
    [HttpDelete("{id}/empty")]
    public async Task<IActionResult> EmptyBag(int id)
    {
        var items = _db.BagItems.Where(b => b.BagId == id);
        _db.BagItems.RemoveRange(items);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Bag emptied" });
    }

    [HttpGet("warehouse-staff/{userId}")]
    public async Task<ActionResult<IEnumerable<Bags>>> GetBagsForWarehouseStaff(int userId)
    {
        // 1. Find the User's Warehouse ID
        // Note: Assuming 'Users' is the table/ DbSet name and 'WarehouseId' is nullable int
        var user = await _db.Users
            .AsNoTracking() // Read-only query, so AsNoTracking is good practice
            .Select(u => new { u.Id, u.WarehouseId }) // Select only necessary columns
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        // Check if the user is assigned a warehouse
        if (user.WarehouseId == null)
        {
            // Return 403 Forbidden or simply an empty list (200 OK)
            return NotFound(new { message = "User is not assigned to a warehouse." });
        }

        int staffWarehouseId = user.WarehouseId.Value;

        // 2. Query the Bags table, filtering by the staff's WarehouseId
        var bags = await _db.Bags
            .AsNoTracking()
            .Where(b => b.WarehouseId == staffWarehouseId)
            .ToListAsync();

        return Ok(bags);
    }
    // 5 Finish Bag
    [HttpPut("{id}/finish")]
    public async Task<IActionResult> FinishBag(int id)
    {
        var bag = await _db.Bags.FindAsync(id);
        if (bag == null) return NotFound();

        bag.Status = "Finished";
        bag.SealIntegrity = "Intact";
        bag.SealedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(bag);
    }
}
