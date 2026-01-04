using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReTrackV1.Data;
using ReTrackV1.Models.Entity;

[ApiController]
[Route("api/[controller]")]
public class ReturnsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ReturnsController(AppDbContext db)
    {
        _db = db;
    }

    // 1️⃣ Get Return details add: Returns.Product.Type
    [HttpGet("{id}")]
    public async Task<IActionResult> GetReturn(string id)
    {
        var ret = await _db.Returns
            .Include(r => r.BagItem)
            .ThenInclude(bi => bi.Bag)
            .Include(r => r.PickupAgent)
            .Include(r => r.Product)
            .FirstOrDefaultAsync(r => r.ReturnCode == id);

        if (ret == null) return NotFound();

        return Ok(ret);
    }

    // 2️⃣ Assign Return to Bag
    [HttpPut("{id}/assign")]
    public async Task<IActionResult> AssignReturnToBag(int id, [FromBody] int bagId)
    {
        var ret = await _db.Returns.FindAsync(id);
        if (ret == null) return NotFound();

        // A Return cannot be directly assigned to a Bag anymore.
        // It must be assigned to a BagItem.

        var bagItem = await _db.BagItems.FirstOrDefaultAsync(bi => bi.ReturnId == id);
        if (bagItem == null)
        {
            // Create a new BagItem if it doesn't exist
            bagItem = new BagItem { ReturnId = id };
            _db.BagItems.Add(bagItem);
        }

        bagItem.BagId = bagId;
        await _db.SaveChangesAsync();

        await _db.SaveChangesAsync();

        return Ok(ret);
    }

    // 3️⃣ Mark Return as Completed
    [HttpPut("{id}/complete")]
    public async Task<IActionResult> CompleteReturn(int id)
    {
        var ret = await _db.Returns.FindAsync(id);
        if (ret == null) return NotFound();

        ret.QCResult = "Completed";
        ret.CompletedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(ret);
    }
}
