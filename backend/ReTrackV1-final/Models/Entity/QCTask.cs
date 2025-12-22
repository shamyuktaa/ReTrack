using System;
using System.ComponentModel.DataAnnotations;

namespace ReTrackV1.Models.Entity
{
    public class QCTask
    {
        [Key]
        public int Id { get; set; }

        public int? ReturnId { get; set; }
        public string ProductId { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string ProductType { get; set; } = string.Empty;

        public string Status { get; set; } = "Pending";  // Pending / Completed

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}