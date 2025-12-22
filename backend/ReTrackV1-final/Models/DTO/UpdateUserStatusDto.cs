namespace ReTrackV1.Models.DTO
{
    public class UpdateUserStatusDto
    {
        public string Status { get; set; } = null!; // Must be supplied (e.g., "Approved", "Rejected", "Active")

        public string? Shift { get; set; }
        public int? WarehouseId { get; set; }

    }
}