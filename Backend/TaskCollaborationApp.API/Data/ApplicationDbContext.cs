using Microsoft.EntityFrameworkCore;
using TaskCollaborationApp.API.Data.Entities;

namespace TaskCollaborationApp.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<TaskItem> Tasks { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.Id);
                entity.Property(u => u.Name).IsRequired().HasMaxLength(100);
                entity.Property(u => u.Email).IsRequired().HasMaxLength(255);
                entity.Property(u => u.Username).IsRequired().HasMaxLength(50);
                entity.Property(u => u.PasswordHash).IsRequired().HasMaxLength(255);
                entity.Property(u => u.Role).IsRequired().HasMaxLength(20);
                entity.Property(u => u.CreatedAt).IsRequired();

                entity.HasIndex(u => u.Email).IsUnique();
                entity.HasIndex(u => u.Username).IsUnique();
            });

            modelBuilder.Entity<TaskItem>(entity =>
            {
                entity.HasKey(t => t.Id);
                entity.Property(t => t.Title).IsRequired().HasMaxLength(200);
                entity.Property(t => t.Description).HasMaxLength(2000);
                entity.Property(t => t.Status).IsRequired();
                entity.Property(t => t.CreatedAt).IsRequired();
                entity.Property(t => t.UpdatedAt).IsRequired();
                entity.Property(t => t.IsArchived).IsRequired();

                // AssignedTo: Optional relationship (1 User : N Tasks)
                entity.HasOne(t => t.CreatedBy)
                      .WithMany(u => u.CreatedTasks)
                      .HasForeignKey(t => t.CreatedById)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(t => t.AssignedTo)
                      .WithMany(u => u.AssignedTasks)
                      .HasForeignKey(t => t.AssignedToId)
                      .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}
