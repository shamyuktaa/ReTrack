using System;
using System.ComponentModel.DataAnnotations;

namespace ReTrackV1.Models.Entity
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        // Role-based notifications
        [Required]
        public string UserRole { get; set; }   // "Warehouse", "QC"

        public string? UserId { get; set; }     // Optional (future use)

        [Required]
        public string Title { get; set; }

        [Required]
        public string Message { get; set; }

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}