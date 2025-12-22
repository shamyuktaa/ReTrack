using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace ReTrackV1.Models.DTO
{
    public class AddUserDto
    {
        // ---------- Personal ----------
        [Required, MaxLength(255)]
        public string Name { get; set; } = null!;

        [Required]
        public DateOnly DOB { get; set; }

        // ---------- Location ----------
        [Required, MaxLength(100)]
        public string State { get; set; } = null!;

        [Required, MaxLength(100)]
        public string City { get; set; } = null!;

        // ---------- Contact ----------
        [Required, MaxLength(500)]
        public string Address { get; set; } = null!;

        [Required, MaxLength(20)]
        public string Phone { get; set; } = null!;

        [Required, MaxLength(150)]
        public string Email { get; set; } = null!;

        // ---------- Documents ----------
        [Required]
        public IFormFile IdentityDocPath { get; set; } = null!;

        public IFormFile? QCCertificatePath { get; set; }

        // ---------- Job ----------
        [Required, MaxLength(20)]
        public string Role { get; set; } = null!;

        [Required, MaxLength(20)]
        public string Shift { get; set; } = "Morning";

        public int? WarehouseId { get; set; }
    }
}
