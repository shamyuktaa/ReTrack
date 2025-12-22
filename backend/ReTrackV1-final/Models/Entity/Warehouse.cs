//namespace ReTrackV1.Models.Entity
//{
//    public class Warehouse
//    {
//        public int Id { get; set; }
//        public string? WCode { get; set; }  // WHXXXXXXXX
//        public string? Address { get; set; }
//        public string? PostalCode { get; set; }
//        public string? City { get; set; }
//        public string? Country { get; set; }
//    }
//}

using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ReTrackV1.Models.Entity
{
    public class Warehouse
    {
        [Key]
        public int Id { get; set; }  // PK

        public string? WCode { get; set; }  // WHXXXXXX (Alternate Key)

        public string? Address { get; set; }
        public string? PostalCode { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }

        [JsonIgnore]
        public ICollection<User>? Staff { get; set; }
        [JsonIgnore]
        public ICollection<Bags>? Bags { get; set; }
    }

}

