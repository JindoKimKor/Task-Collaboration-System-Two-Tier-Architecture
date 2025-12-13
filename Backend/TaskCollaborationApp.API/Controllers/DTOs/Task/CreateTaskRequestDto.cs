using System.ComponentModel.DataAnnotations;

namespace TaskCollaborationApp.API.Controllers.DTOs.Task
{
    /// <summary>
    /// Request body for creating a new task.
    /// </summary>
    public class CreateTaskRequestDto
    {
        [Required(ErrorMessage = "Title is required")]
        [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Status is required")]
        public string Status { get; set; } = "ToDo";

        public int? AssignedToId { get; set; }
    }
}
