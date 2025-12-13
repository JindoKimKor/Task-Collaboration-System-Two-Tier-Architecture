using TaskCollaborationApp.API.Data.Entities;
using BCryptNet = BCrypt.Net.BCrypt;
using TaskStatus = TaskCollaborationApp.API.Data.Entities.TaskStatus;

namespace TaskCollaborationApp.API.Data
{
    public class DbSeeder
    {
        public static void Seed(ApplicationDbContext context)
        {
            var users = new List<User>
            {
                new User { Name = "Admin User",    Email = "admin@taskcollab.com",    Username = "admin",       PasswordHash = BCryptNet.HashPassword("Admin123!"), Role = "Admin", CreatedAt = DateTime.UtcNow },
                new User { Name = "John Doe",      Email = "john@example.com",        Username = "johndoe",     PasswordHash = BCryptNet.HashPassword("User123!"),  Role = "User",  CreatedAt = DateTime.UtcNow },
                new User { Name = "Jane Smith",    Email = "jane@example.com",        Username = "janesmith",   PasswordHash = BCryptNet.HashPassword("User123!"),  Role = "User",  CreatedAt = DateTime.UtcNow },
                new User { Name = "Mike Johnson",  Email = "mike@example.com",        Username = "mikejohnson", PasswordHash = BCryptNet.HashPassword("User123!"),  Role = "User",  CreatedAt = DateTime.UtcNow },
                new User { Name = "Sarah Chen",    Email = "sarah@example.com",       Username = "sarahchen",   PasswordHash = BCryptNet.HashPassword("User123!"),  Role = "User",  CreatedAt = DateTime.UtcNow },
            };

            // Skip if any data in the DB, not really needed with InMemeryDb
            if (!context.Users.Any())
            {
                context.Users.AddRange(users);
                context.SaveChanges();
            }

            // Seed Tasks
            var tasks = new List<TaskItem>
            {
                new TaskItem
                {
                    Title = "Setup project structure",
                    Description = "Initialize the project with proper folder structure and configurations.",
                    Status = TaskStatus.Done,
                    CreatedById = 1,
                    AssignedToId = 2,
                    CreatedAt = DateTime.UtcNow.AddDays(-7),
                    UpdatedAt = DateTime.UtcNow.AddDays(-5),
                    IsArchived = false
                },
                new TaskItem
                {
                    Title = "Implement user authentication",
                    Description = "Create login, registration, and JWT token authentication.",
                    Status = TaskStatus.Done,
                    CreatedById = 1,
                    AssignedToId = 3,
                    CreatedAt = DateTime.UtcNow.AddDays(-6),
                    UpdatedAt = DateTime.UtcNow.AddDays(-3),
                    IsArchived = false
                },
                new TaskItem
                {
                    Title = "Design database schema",
                    Description = "Create Entity Framework models and configure relationships.",
                    Status = TaskStatus.Review,
                    CreatedById = 2,
                    AssignedToId = 4,
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1),
                    IsArchived = false
                },
                new TaskItem
                {
                    Title = "Build task API endpoints",
                    Description = "Implement CRUD operations for tasks with proper validation.",
                    Status = TaskStatus.Development,
                    CreatedById = 2,
                    AssignedToId = 5,
                    CreatedAt = DateTime.UtcNow.AddDays(-4),
                    UpdatedAt = DateTime.UtcNow,
                    IsArchived = false
                },
                new TaskItem
                {
                    Title = "Create Kanban board UI",
                    Description = "Build the frontend Kanban board with drag and drop functionality.",
                    Status = TaskStatus.ToDo,
                    CreatedById = 3,
                    AssignedToId = null,
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                    UpdatedAt = DateTime.UtcNow.AddDays(-3),
                    IsArchived = false
                },
                new TaskItem
                {
                    Title = "Add real-time updates with SignalR",
                    Description = "Implement SignalR for live task updates across clients.",
                    Status = TaskStatus.ToDo,
                    CreatedById = 1,
                    AssignedToId = 2,
                    CreatedAt = DateTime.UtcNow.AddDays(-2),
                    UpdatedAt = DateTime.UtcNow.AddDays(-2),
                    IsArchived = false
                },
                new TaskItem
                {
                    Title = "Implement caching strategy",
                    Description = "Add in-memory caching for frequently accessed data.",
                    Status = TaskStatus.Merge,
                    CreatedById = 4,
                    AssignedToId = 4,
                    CreatedAt = DateTime.UtcNow.AddDays(-1),
                    UpdatedAt = DateTime.UtcNow,
                    IsArchived = false
                }
            };

            if (!context.Tasks.Any())
            {
                context.Tasks.AddRange(tasks);
                context.SaveChanges();
            }
        }
    }
}
