using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReTrackV1.Models.Entity
{
    public class Bags
    {
        [Key]
        public int Id { get; set; }

        public string? BagCode { get; set; }

        public int? PickupAgentId { get; set; }

        [ForeignKey(nameof(PickupAgentId))]
        public User? PickupAgent { get; set; }

        public int? WarehouseId { get; set; }

        [ForeignKey(nameof(WarehouseId))]
        public Warehouse? Warehouse { get; set; }

        public string? Status { get; set; } = "Open";   // Open, Finished, InWarehouse
        public string? SealIntegrity { get; set; } = "Unknown";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? SealedAt { get; set; }

        // 🔑 IMPORTANT
        public ICollection<BagItem> Items { get; set; } = new List<BagItem>();
    }
}
