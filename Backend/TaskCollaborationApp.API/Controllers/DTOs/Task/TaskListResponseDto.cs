namespace TaskCollaborationApp.API.Controllers.DTOs.Task
{
    /// <summary>
    /// Paginated response for task lists.
    /// Used for GET /api/tasks, /api/tasks/my, /api/tasks/assigned.
    /// </summary>
    public class TaskListResponseDto
    {
        public IEnumerable<TaskResponseDto> Data { get; set; } = new List<TaskResponseDto>();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
    }
}
