using System.ComponentModel.DataAnnotations;

namespace ReTrackV1.Models.DTO
{
    public class BagItemCreationDto
    {
        [Required]
        public int? BagId { get; set; }

        [Required]
        public int? ReturnId { get; set; }
    }
}
