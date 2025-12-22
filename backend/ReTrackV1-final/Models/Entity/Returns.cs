using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ReTrackV1.Models.Entity
{
    public class Returns
    {
        public int Id { get; set; }

        public string? ReturnCode { get; set; }

        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public string? Location { get; set; }

        public DateTime? PickupTime { get; set; }
        public string? PickupStatus { get; set; }

        // ===================== AGENT =====================
        public int? PickupAgentId { get; set; }

        [ForeignKey(nameof(PickupAgentId))]
        public User? PickupAgent { get; set; }

        // ===================== PRODUCT =====================
        public int? ProductId { get; set; }

        [ForeignKey(nameof(ProductId))]
        public Product? Product { get; set; }

        // ✅ STEP FIX: STORE CATEGORY DIRECTLY IN RETURNS
        public string? ProductCategory { get; set; }

        // ===================== BAG ITEM =====================
        [JsonIgnore]
        public BagItem? BagItem { get; set; }

        // ===================== QC =====================
        public string? QCResult { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        public DateTime? FailedAt { get; set; }
    }
}
