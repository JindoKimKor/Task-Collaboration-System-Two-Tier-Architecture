namespace TaskCollaborationApp.API.Controllers.DTOs.Task
{
    /// <summary>
    /// Response body for a single task.
    /// Used for GET /api/tasks/{id}, POST, and PUT responses.
    /// </summary>
    public class TaskResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        public UserSummaryDto CreatedBy { get; set; } = null!;
        public UserSummaryDto? AssignedTo { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsArchived { get; set; }
        public DateTime? ArchivedAt { get; set; }
    }
}
