using TaskCollaborationApp.API.Data.Entities;
using BCryptNet = BCrypt.Net.BCrypt;

namespace TaskCollaborationApp.API.Data
{
    public class DbSeeder
    {
        public static void Seed(ApplicationDbContext context)
        {
            // Skip if any data in the DB, not really needed with InMemeryDb
            if (context.Users.Any()) return;

            var users = new List<User>
            {
                new User { Name = "Admin User",    Email = "admin@taskcollab.com",    Username = "admin",       PasswordHash = BCryptNet.HashPassword("Admin123!"), Role = "Admin", CreatedAt = DateTime.UtcNow },
                new User { Name = "John Doe",      Email = "john@example.com",        Username = "johndoe",     PasswordHash = BCryptNet.HashPassword("User123!"),  Role = "User",  CreatedAt = DateTime.UtcNow },
                new User { Name = "Jane Smith",    Email = "jane@example.com",        Username = "janesmith",   PasswordHash = BCryptNet.HashPassword("User123!"),  Role = "User",  CreatedAt = DateTime.UtcNow },
                new User { Name = "Mike Johnson",  Email = "mike@example.com",        Username = "mikejohnson", PasswordHash = BCryptNet.HashPassword("User123!"),  Role = "User",  CreatedAt = DateTime.UtcNow },
                new User { Name = "Sarah Chen",    Email = "sarah@example.com",       Username = "sarahchen",   PasswordHash = BCryptNet.HashPassword("User123!"),  Role = "User",  CreatedAt = DateTime.UtcNow },
            };

            context.Users.AddRange(users);
            context.SaveChanges();
        }
    }
}
