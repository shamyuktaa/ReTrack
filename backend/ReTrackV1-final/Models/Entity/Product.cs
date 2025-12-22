using System.ComponentModel.DataAnnotations;

namespace ReTrackV1.Models.Entity
{
    public class Product
    {
        [Key]
        public int Id { get; set; }  // PK
        public string ProductID { get; set; }="";

        public string Name { get; set; }="";

        public string Type { get; set; }="";

        public string Description { get; set; }="";

        public string ImageUrl { get; set; }="";
        
    }
}
