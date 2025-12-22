using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReTrackV1.Data;
using ReTrackV1.Models.DTO;
using ReTrackV1.Models.Entity;

[ApiController]
[Route("api/[controller]")]
public class BagItemsController : ControllerBase
{
    private readonly AppDbContext _db;

    public BagItemsController(AppDbContext db)
    {
        _db = db;
    }

    // 1️⃣ Get all items of a bag
    [HttpGet("bag/{bagId}")]
    public async Task<IActionResult> GetItemsForBag(int bagId)
    {
        var items = await _db.BagItems
            .Include(b => b.Return)
                .ThenInclude(r => r.Product)
            .Where(b => b.BagId == bagId)
            .ToListAsync();

        return Ok(items);
    }

    // 2️⃣ Scan item (Expected: Yes / No / Missing)
    [HttpPut("{id}/scan")]
    public async Task<IActionResult> ScanItem(int id, [FromBody] string expectedValue)
    {
        var item = await _db.BagItems.FindAsync(id);
        if (item == null) return NotFound();

        item.Expected = expectedValue;
        await _db.SaveChangesAsync();

        return Ok(item);
    }

    // 3️⃣ Update item status (Proceed / Report)
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] string newStatus)
    {
        var item = await _db.BagItems.FindAsync(id);
        if (item == null) return NotFound();

        item.Status = newStatus;
        await _db.SaveChangesAsync();

        return Ok(item);
    }

    // 4️⃣ Add return to bag  ✅ FIXED
    [HttpPost]
    public async Task<IActionResult> CreateBagItem([FromBody] BagItemCreationDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // ✅ REQUIRED NULL CHECK (FIXES int? → int ERROR)
        if (dto.BagId == null || dto.ReturnId == null)
            return BadRequest("BagId and ReturnId are required.");

        var bagExists = await _db.Bags.AnyAsync(b => b.Id == dto.BagId.Value);
        var returnExists = await _db.Returns.AnyAsync(r => r.Id == dto.ReturnId.Value);

        if (!bagExists || !returnExists)
            return BadRequest("Invalid BagId or ReturnId provided.");

        var newBagItem = new BagItem
        {
            BagId = dto.BagId.Value,
            ReturnId = dto.ReturnId.Value,
            Expected = "No",
            Status = "Report"
        };

        _db.BagItems.Add(newBagItem);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetItemsForBag),
            new { bagId = dto.BagId.Value },
            newBagItem
        );
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
