using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ReTrackV1.Models.Entity
{
    public class BagItem
    {
        [Key]
        public int Id { get; set; }

        public int BagId { get; set; }

        [JsonIgnore]
        [ForeignKey(nameof(BagId))]
        public Bags Bag { get; set; } = null!;

        public int ReturnId { get; set; }

        [ForeignKey(nameof(ReturnId))]
        public Returns Return { get; set; } = null!;

        public string ProductId { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string ProductType { get; set; } = string.Empty;

        public string? Expected { get; set; }
        public string? Status { get; set; }
    }
}
