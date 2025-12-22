using Microsoft.EntityFrameworkCore;
using ReTrackV1.Models.Entity;

namespace ReTrackV1.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        // ────────────────────────────────
        // DB SETS
        // ────────────────────────────────
        public DbSet<User> Users { get; set; }
        public DbSet<Warehouse> Warehouses { get; set; }
        public DbSet<Bags> Bags { get; set; }
        public DbSet<BagItem> BagItems { get; set; }
        public DbSet<Returns> Returns { get; set; }
        public DbSet<Product> Products { get; set; }

        public DbSet<IssueReport> IssueReports { get; set; }
        public DbSet<Report> Reports { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        public DbSet<QCTask> QCTasks { get; set; }
        public DbSet<QCReport> QCReports { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        // ────────────────────────────────
        // MODEL CONFIGURATION
        // ────────────────────────────────
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ================================
            // WAREHOUSE
            // ================================
            modelBuilder.Entity<Warehouse>()
                .HasAlternateKey(w => w.WCode)
                .HasName("AK_Warehouse_WCode");

            modelBuilder.Entity<Warehouse>()
                .HasMany(w => w.Staff)
                .WithOne(u => u.Warehouse)
                .HasForeignKey(u => u.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Warehouse>()
                .HasMany(w => w.Bags)
                .WithOne(b => b.Warehouse)
                .HasForeignKey(b => b.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);

            // ================================
            // BAGS
            // ================================
            modelBuilder.Entity<Bags>()
                .HasAlternateKey(b => b.BagCode)
                .HasName("AK_Bags_BagCode");

            modelBuilder.Entity<Bags>()
                .HasOne(b => b.PickupAgent)
                .WithMany()
                .HasForeignKey(b => b.PickupAgentId)
                .OnDelete(DeleteBehavior.Restrict);

            // ================================
            // RETURNS
            // ================================
            modelBuilder.Entity<Returns>()
                .HasAlternateKey(r => r.ReturnCode)
                .HasName("AK_Returns_ReturnCode");

            modelBuilder.Entity<Returns>()
                .HasOne(r => r.PickupAgent)
                .WithMany()
                .HasForeignKey(r => r.PickupAgentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Returns>()
                .HasOne(r => r.Product)
                .WithMany()
                .HasForeignKey(r => r.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            // ================================
            // BAG ITEM (⭐ MOST IMPORTANT ⭐)
            // ================================

            // Bag → BagItem (1-to-many)
            modelBuilder.Entity<BagItem>()
                .HasOne(bi => bi.Bag)
                .WithMany(b => b.Items)
                .HasForeignKey(bi => bi.BagId)
                .OnDelete(DeleteBehavior.Restrict);

            // Return → BagItem (1-to-1)
            modelBuilder.Entity<BagItem>()
                .HasOne(bi => bi.Return)
                .WithOne(r => r.BagItem)
                .HasForeignKey<BagItem>(bi => bi.ReturnId)
                .OnDelete(DeleteBehavior.Restrict);

            // ================================
            // ISSUE REPORT
            // ================================
            modelBuilder.Entity<IssueReport>()
                .HasAlternateKey(ir => ir.IssueID)
                .HasName("AK_IssueReport_IssueID");

            modelBuilder.Entity<IssueReport>()
                .HasOne(ir => ir.Bag)
                .WithMany()
                .HasForeignKey(ir => ir.BagId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<IssueReport>()
                .HasOne(ir => ir.Return)
                .WithMany()
                .HasForeignKey(ir => ir.ReturnId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
