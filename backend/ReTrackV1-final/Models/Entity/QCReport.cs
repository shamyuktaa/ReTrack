using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ReTrackV1.Models.Entity
{
    public class QCReport
    {
        [Key]
        public int ReportID { get; set; }

        // 👇 Map frontend "productId" → backend "ProductID"
        [JsonPropertyName("ProductID")]
        public string? ProductID { get; set; }

        public string? DefectType { get; set; }

        public int Severity { get; set; }

        public string? Notes { get; set; }

        public string? FinalDecision { get; set; }

        public string? InspectorName { get; set; }

        public DateTime InspectionDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
