using System;
using System.Linq;
using ReTrackV1.Models.Entity;
using ReTrackV1.Data;
namespace ReTrackV1.Data
{
    public static class SeedData
    {
        public static void Initialize(AppDbContext db)
        {
            if (db.Users.Any()) return; // already seeded

            // Users
            var admin = new User { Name = "Admin User", Email = "admin@retrack.com", Role = "Admin", Phone = "9999999999" };
            var agent = new User { Name = "Agent One", Email = "agent1@retrack.com", Role = "PickupAgent", Phone = "9876543210" };
            var agent2 = new User { Name = "Agent Two", Email = "agent2@retrack.com", Role = "PickupAgent", Phone = "9876543211" };

            db.Users.AddRange(admin, agent, agent2);
            db.SaveChanges();

            // Returns (pickups)
            var r1 = new Returns
            {
                ReturnCode = "RET0100",
                CustomerName = "Aditi Sharma",
                CustomerPhone = "9000000001",
                Location = "Ritchie Street, Chintadripet, Chennai",
                PickupTime = DateTime.UtcNow.Date.AddHours(11),
                PickupStatus = "Pending",
                PickupAgentId = agent.Id,
                CreatedAt = DateTime.UtcNow
            };

            var r2 = new Returns
            {
                ReturnCode = "RET0101",
                CustomerName = "Priya Sharma",
                CustomerPhone = "9000000002",
                Location = "Besant Nagar, Chennai",
                PickupTime = DateTime.UtcNow.Date.AddHours(12).AddMinutes(30),
                PickupStatus = "In Progress",
                PickupAgentId = agent.Id,
                CreatedAt = DateTime.UtcNow
            };

            var r3 = new Returns
            {
                ReturnCode = "RET0102",
                CustomerName = "Chaitanya Reddy",
                CustomerPhone = "9000000003",
                Location = "Mylapore, Chennai",
                PickupTime = DateTime.UtcNow.Date.AddHours(14),
                PickupStatus = "Completed",
                PickupAgentId = agent2.Id,
                CreatedAt = DateTime.UtcNow
            };

            db.Returns.AddRange(r1, r2, r3);
            db.SaveChanges();

            // Bags
            var b1 = new Bags
            {
                BagCode = "BAG001",
                PickupAgentId = agent.Id,
                Status = "Pending",
                WarehouseId = 1,
                CreatedAt = DateTime.UtcNow
            };

            var b2 = new Bags
            {
                BagCode = "BAG002",
                PickupAgentId = agent.Id,
                Status = "Picked",
                WarehouseId = 1,
                CreatedAt = DateTime.UtcNow
            };

            db.Bags.AddRange(b1, b2);
            db.SaveChanges();

            // BagItems (link returns to bag)
            var bi1 = new BagItem { BagId = b1.Id, ReturnId = r1.Id, Expected = "Yes", Status = "Pending" };
            var bi2 = new BagItem { BagId = b2.Id, ReturnId = r2.Id, Expected = "Yes", Status = "Proceed" };

            db.BagItems.AddRange(bi1, bi2);
            db.SaveChanges();
        }
    }
}
