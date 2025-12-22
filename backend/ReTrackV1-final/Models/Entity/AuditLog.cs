using System;
using System.ComponentModel.DataAnnotations;

namespace ReTrackV1.Models.Entity
{
    public class AuditLog
    {
        [Key]
        public int AuditLogId { get; set; }

        [MaxLength(100)]
        public string Entity { get; set; } = string.Empty;

        // e.g. the PK value of the entity being changed
        public string EntityId { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Action { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string Details { get; set; } = string.Empty;

        public int? PerformedByUserId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
