namespace ReTrackV1.Models.DTO
{
    using ReTrackV1.Models.Entity;
    using System;

    public class ApprovedUserDto
    {
        // -----------------------------------------------------------------
        // STATIC HELPER METHOD
        // -----------------------------------------------------------------
        public static string GeneratePublicId(string role, int internalId)
        {
            var prefix = role switch
            {
                "PickupAgent" => "PA",
                "WarehouseStaff" => "WA",
                "QCStaff" => "QCA",
                "Admin" => "AA",
                _ => "US"
            };
            return $"{prefix}{internalId:D4}";
        }

        // -----------------------------------------------------------------
        // DTO PROPERTIES
        // -----------------------------------------------------------------
        public string? UserId { get; set; }
        public string Shift { get; set; }
        public DateOnly? EmploymentDate { get; set; }
        public string? PasswordHash { get; set; }
        public int? WarehouseId { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public ApprovedUserDto() { }

    }
}