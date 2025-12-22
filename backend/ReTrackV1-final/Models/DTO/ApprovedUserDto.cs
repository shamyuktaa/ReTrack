namespace ReTrackV1.Models.DTO
{
    using ReTrackV1.Models.Entity;
    using System;

    public class ApprovedUserDto
    {
        // -----------------------------------------------------------------
        // STATIC HELPER METHOD (Corrected to be static)
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

        // Parameterless constructor for deserialization (optional but good practice)
        public ApprovedUserDto() { }

        //public ApprovedUserDto(User user)
        //{
        //    // Now you have a reference to the 'user' object!
        //    this.UserId = GeneratePublicId(user.Role, user.Id);

        //    // Map existing user properties (if they exist)
        //    this.Shift = user.Shift;
        //    this.PasswordHash = GeneratePublicId(user.Role, user.Id);
        //    this.WarehouseId = user.WarehouseId;

        //    // Set properties relevant to approval/update
        //    this.EmploymentDate = DateOnly.FromDateTime(DateTime.UtcNow);
        //    this.UpdatedAt = DateTime.UtcNow;
        //}
    }
}