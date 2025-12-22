
using System.ComponentModel.DataAnnotations.Schema;

namespace ReTrackV1.Models.Entity
{
    public class IssueReport
    {
        public int Id { get; set; } // PK

        public string? IssueID { get; set; } // Alternate Key

        // FKs
        public int? BagId { get; set; }
        [ForeignKey(nameof(BagId))]
        public Bags? Bag { get; set; }

        public int? ReturnId { get; set; }
        [ForeignKey(nameof(ReturnId))]
        public Returns? Return { get; set; }

        public string? Type { get; set; }
        public string? Status { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ResolvedAt { get; set; }

        public string? Notes { get; set; }
    }
}