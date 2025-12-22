using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ReTrackV1.Models.Entity
{
    [Table("Users")]
    public class User
    {
        [Key]
        public int Id { get; set; }   // Primary Key

        [MaxLength(10)]
        public string? UserId { get; set; }  // PA001, QC010, WS003 

        [Required, MaxLength(255)]
        public string Name { get; set; } = null!;

        public DateOnly DOB { get; set; }

        // ✅ NEW FIELDS (AS REQUESTED)
        [Required, MaxLength(100)]
        public string State { get; set; } = null!;

        [Required, MaxLength(100)]
        public string City { get; set; } = null!;

        [Required, MaxLength(500)]
        public string Address { get; set; } = null!;

        [Required, MaxLength(20)]
        public string Phone { get; set; } = null!;

        [Required, MaxLength(150)]
        public string Email { get; set; } = null!;

        public string? PasswordHash { get; set; }

        [Required, MaxLength(1000)]
        public string IdentityDocPath { get; set; } = null!;

        [Required, MaxLength(20)]
        public string Role { get; set; } = null!;

        [Required, MaxLength(20)]
        public string Shift { get; set; } = "Morning";

        public int? WarehouseId { get; set; }

        [ForeignKey(nameof(WarehouseId))]
        public Warehouse? Warehouse { get; set; }

        public string? QCCertificatePath { get; set; }

        [Required, MaxLength(20)]
        public string Status { get; set; } = "Pending";

        public DateOnly? EmploymentDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation Properties
        [JsonIgnore]
        public ICollection<Bags>? BagsPickedUp { get; set; }

        [JsonIgnore]
        public ICollection<Returns>? ReturnsAssigned { get; set; }
    }
}
