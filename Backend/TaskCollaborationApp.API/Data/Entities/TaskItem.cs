namespace TaskCollaborationApp.API.Data.Entities
{
    public class TaskItem
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public TaskStatus Status { get; set; }
        public int CreatedById { get; set; }
        public int? AssignedToId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsArchived { get; set; }
        public DateTime? ArchivedAt { get; set; }

        // Navigation Properties
        public User CreatedBy { get; set; } = null!;
        public User? AssignedTo { get; set; }
    }
}
