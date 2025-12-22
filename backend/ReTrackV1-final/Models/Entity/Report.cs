using System;
using System.ComponentModel.DataAnnotations;

namespace ReTrackV1.Models.Entity
{
    public class Report
    {
        [Key]
        public int ReportId { get; set; }

        // optional external return code like "R021"
        [MaxLength(50)]
        public string ReturnCode { get; set; } = string.Empty;

        // optional numeric FK to Return.ReturnId
        public int? ReturnId { get; set; }

        // Agent who reported
        public int? AgentId { get; set; }

        [MaxLength(100)]
        public string IssueType { get; set; } = "General";

        [MaxLength(2000)]
        public string Notes { get; set; } = string.Empty;

        public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
