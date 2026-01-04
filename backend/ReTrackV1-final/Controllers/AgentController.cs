using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReTrackV1.Data;
using ReTrackV1.Models.Entity;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace ReTrackV1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AgentController : ControllerBase
    {
        private readonly AppDbContext _db;

        public AgentController(AppDbContext db)
        {
            _db = db;
        }

        // ===================== SUMMARY =====================
        [HttpGet("{agentId}/summary")]
        public async Task<IActionResult> GetSummary(int agentId)
        {
            var agent = await _db.Users.FirstOrDefaultAsync(u => u.Id == agentId);
            if (agent == null)
                return BadRequest(new { message = "Agent not found" });

            var city = agent.City ?? "";

            var q = _db.Returns
                .Where(r => EF.Functions.Like(r.Location!, "%" + city + "%"));

            return Ok(new
            {
                total = await q.CountAsync(),
                pending = await q.CountAsync(r => r.PickupStatus == "Pending"),
                inprogress = await q.CountAsync(r => r.PickupStatus == "In Progress"),
                completed = await q.CountAsync(r => r.PickupStatus == "Bagged")
            });
        }

        // ===================== PICKUPS =====================
        [HttpGet("{agentId}/pickups")]
        public async Task<IActionResult> GetPickups(int agentId, int page = 1, int pageSize = 25)
        {
            var agent = await _db.Users.FirstOrDefaultAsync(u => u.Id == agentId);
            if (agent == null)
                return BadRequest(new { message = "Agent not found" });

            var city = agent.City ?? "";

            var q = _db.Returns
                .Where(r => EF.Functions.Like(r.Location!, "%" + city + "%"));

            var total = await q.CountAsync();

            var items = await q
                .OrderBy(r => r.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    returnId = r.ReturnCode,
                    customerName = r.CustomerName,
                    customerPhone = r.CustomerPhone,
                    location = r.Location,
                    pickupStatus = r.PickupStatus,
                    bagCode = _db.BagItems
                        .Where(bi => bi.ReturnId == r.Id)
                        .Select(bi => bi.Bag.BagCode)
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, items });
        }

        // ===================== VERIFY RETURN =====================
        [HttpPost("returns/{returnCode}/verify")]
        public async Task<IActionResult> VerifyReturn(string returnCode, [FromQuery] int agentId)
        {
            var ret = await _db.Returns.FirstOrDefaultAsync(r => r.ReturnCode == returnCode);
            if (ret == null)
                return NotFound(new { message = "Invalid return ID" });

            var agentCity = await _db.Users
                .Where(u => u.Id == agentId)
                .Select(u => u.City)
                .FirstOrDefaultAsync();

            if (string.IsNullOrWhiteSpace(agentCity) ||
                !ret.Location!.Contains(agentCity, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Return not for your region" });
            }

            if (string.IsNullOrEmpty(ret.PickupStatus) || ret.PickupStatus == "Pending")
            {
                ret.PickupStatus = "In Progress";
                await _db.SaveChangesAsync();
            }

            return Ok(new { status = ret.PickupStatus });
        }

        // ===================== CREATE BAG =====================
        [HttpPost("bags")]
        public async Task<IActionResult> CreateBag([FromBody] CreateBagDto dto)
        {
            var agent = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == dto.PickupAgentId && u.Role == "PickupAgent");

            if (agent == null)
                return BadRequest(new { message = "Invalid pickup agent" });

            var bag = new Bags
            {
                BagCode = $"BAG-{DateTime.UtcNow:yyMMddHHmmssfff}",
                PickupAgentId = agent.Id,
                Status = "Open",
                CreatedAt = DateTime.UtcNow,
                WarehouseId = agent.WarehouseId,
                SealIntegrity = "Intact"
            };

            _db.Bags.Add(bag);
            await _db.SaveChangesAsync();

            return Ok(new { bagId = bag.Id, bagCode = bag.BagCode });
        }

        // ===================== LIST BAGS =====================
        [HttpGet("{agentId}/bags")]
        public async Task<IActionResult> GetBags(int agentId)
        {
            var agentCity = await _db.Users
                .Where(u => u.Id == agentId)
                .Select(u => u.City)
                .FirstOrDefaultAsync();

            if (string.IsNullOrWhiteSpace(agentCity))
                return Ok(new object[] { });

            var bags = await _db.Bags
                .Include(b => b.PickupAgent)
                .Where(b => b.PickupAgentId == agentId && b.PickupAgent!.City == agentCity)
                .OrderByDescending(b => b.Id)
                .Select(b => new
                {
                    bagId = b.Id,
                    bagCode = b.BagCode,
                    status = b.Status
                })
                .ToListAsync();

            return Ok(bags);
        }

        // ===================== BAG DETAILS =====================
        [HttpGet("bags/{bagId}")]
        public async Task<IActionResult> GetBagDetail(int bagId)
        {
            var bag = await _db.Bags
                .Include(b => b.Items)
                .ThenInclude(i => i.Return).ThenInclude(r => r.Product)
                .FirstOrDefaultAsync(b => b.Id == bagId);

            if (bag == null)
                return NotFound(new { message = "Bag not found" });

            return Ok(new
            {
                bagId = bag.Id,
                bagCode = bag.BagCode,
                status = bag.Status,
                totalItems = bag.Items.Count,
                products = bag.Items.Select(i => new
                {
                    returnId = i.Return.ReturnCode,
                    customerName = i.Return.CustomerName,
                    customerPhone = i.Return.CustomerPhone,
                    productCategory = i.Return.Product.Type,
                    status = i.Return.PickupStatus
                })
            });
        }

        // ===================== ASSIGN RETURN =====================
        [HttpPost("bags/{bagId}/assign")]
        public async Task<IActionResult> AssignReturnToBag(int bagId, [FromBody] AssignDto dto)
        {
            var bag = await _db.Bags
                .Include(b => b.PickupAgent)
                .FirstOrDefaultAsync(b => b.Id == bagId);

            if (bag == null)
                return NotFound(new { message = "Bag not found" });

            if (bag.Status == "Sealed")
                return BadRequest(new { message = "Bag is sealed. Cannot assign returns." });

            var agentCity = bag.PickupAgent?.City;
            if (string.IsNullOrWhiteSpace(agentCity))
                return BadRequest(new { message = "Agent city not configured" });

            var ret = await _db.Returns.Include(r => r.Product).FirstOrDefaultAsync(r =>
                r.ReturnCode == dto.ReturnIdentifier &&
                r.Location != null &&
                r.Location.Contains(agentCity));

            if (ret == null)
                return NotFound(new { message = "Return not found in your region" });

            if (ret.PickupStatus != "In Progress")
                return BadRequest(new { message = "Invalid return state" });

            _db.BagItems.Add(new BagItem
            {
                BagId = bag.Id,
                ReturnId = ret.Id,
                ProductId = ret.Product.ProductID ?? "Unknown",
                ProductType = ret.Product.Type ?? "Unknown"
            });

            ret.PickupStatus = "Bagged";
            await _db.SaveChangesAsync();

            return Ok(new { message = "Return bagged successfully" });
        }

        // ===================== SEAL BAG =====================
        [HttpPost("bags/{bagCode}/seal")]
        public async Task<IActionResult> SealBag(string bagCode)
        {
            var bag = await _db.Bags.FirstOrDefaultAsync(b => b.BagCode == bagCode);
            if (bag == null)
                return NotFound(new { message = "Bag not found" });

            if (bag.Status == "Sealed")
                return Ok(new { message = "Bag already sealed" });

            bag.Status = "Sealed";
            bag.SealedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Bag sealed successfully" });
        }

        // ===================== REPORT RETURN =====================
        [HttpPost("returns/{returnCode}/report")]
        public async Task<IActionResult> ReportReturn(string returnCode, [FromBody] ReportReturnDto dto)
        {
            var ret = await _db.Returns
                .Include(r => r.BagItem)
                .FirstOrDefaultAsync(r => r.ReturnCode == returnCode);

            if (ret == null)
                return NotFound(new { message = "Invalid return ID" });

            var reason = dto.Reason.Trim().ToLower();

            if (reason == "customer not available")
            {
                ret.PickupStatus = "Pending";
                await _db.SaveChangesAsync();
                return Ok(new { message = "Marked as customer not available" });
            }

            if (reason == "return id not matched" || reason == "product not matched")
            {
                if (ret.BagItem != null)
                    _db.BagItems.Remove(ret.BagItem);

                _db.Returns.Remove(ret);
                await _db.SaveChangesAsync();

                return Ok(new { message = "Return deleted due to mismatch" });
            }

            return Ok(new { message = "Report noted" });
        }

        // ===================== DELIVER BAGS TO WAREHOUSE (NEW) =====================
        [HttpPost("deliver-to-warehouse")]
        public async Task<IActionResult> DeliverBagsToWarehouse([FromBody] List<int> bagIds)
        {
            if (bagIds == null || !bagIds.Any())
                return BadRequest(new { message = "No bags selected for delivery" });

            var bagsToUpdate = await _db.Bags
                .Where(b => bagIds.Contains(b.Id))
                .ToListAsync();

            if (!bagsToUpdate.Any())
                return NotFound(new { message = "No matching bags found" });

            foreach (var bag in bagsToUpdate)
            {
                bag.Status = "InWarehouse";
            }

            await _db.SaveChangesAsync();

            var notification = new Notification
            {
                UserRole = "Warehouse",
                Title = "Bags Delivered to Warehouse",
                Message = $"Agent delivered {bagsToUpdate.Count} bag(s) to the warehouse",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _db.Notifications.Add(notification);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = $"Successfully delivered {bagsToUpdate.Count} bags to warehouse"
            });
        }

        // ===================== DTOs =====================
        public class CreateBagDto
        {
            public int PickupAgentId { get; set; }
        }

        public class AssignDto
        {
            public string ReturnIdentifier { get; set; } = "";
        }

        public class ReportReturnDto
        {
            public string Reason { get; set; } = "";
        }
    }
}