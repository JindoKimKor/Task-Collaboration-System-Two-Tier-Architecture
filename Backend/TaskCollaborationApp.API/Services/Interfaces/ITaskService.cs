using TaskCollaborationApp.API.Controllers.DTOs.Task;
using TaskStatus = TaskCollaborationApp.API.Data.Entities.TaskStatus;

namespace TaskCollaborationApp.API.Services.Interfaces
{
    /// <summary>
    /// Task service contract.
    /// Handles task CRUD operations and business logic.
    /// </summary>
    public interface ITaskService
    {
        /// <summary>
        /// Gets paginated tasks with optional filtering.
        /// </summary>
        /// <param name="page">Page number (1-based)</param>
        /// <param name="pageSize">Items per page</param>
        /// <param name="status">Filter by status</param>
        /// <param name="assignedToId">Filter by assignee</param>
        /// <param name="createdById">Filter by creator</param>
        /// <param name="search">Search in title/description</param>
        /// <param name="includeArchived">Include archived tasks (admin only)</param>
        Task<TaskListResponseDto> GetTasksAsync(
            int page,
            int pageSize,
            TaskStatus? status = null,
            int? assignedToId = null,
            int? createdById = null,
            string? search = null,
            bool includeArchived = false);

        /// <summary>
        /// Gets a single task by ID.
        /// </summary>
        Task<TaskResponseDto?> GetTaskByIdAsync(int id);

        /// <summary>
        /// Gets tasks created by a specific user.
        /// </summary>
        Task<TaskListResponseDto> GetMyTasksAsync(int userId, int page, int pageSize);

        /// <summary>
        /// Gets tasks assigned to a specific user.
        /// </summary>
        Task<TaskListResponseDto> GetAssignedTasksAsync(int userId, int page, int pageSize);

        /// <summary>
        /// Creates a new task.
        /// </summary>
        /// <param name="request">Task creation data</param>
        /// <param name="createdById">User ID from JWT token</param>
        Task<TaskResponseDto> CreateTaskAsync(CreateTaskRequestDto request, int createdById);

        /// <summary>
        /// Updates an existing task.
        /// </summary>
        /// <param name="id">Task ID</param>
        /// <param name="request">Task update data</param>
        /// <param name="userId">User ID from JWT token (for authorization)</param>
        /// <param name="userRole">User role from JWT token (for authorization)</param>
        /// <exception cref="KeyNotFoundException">Task not found</exception>
        /// <exception cref="UnauthorizedAccessException">User not authorized</exception>
        Task<TaskResponseDto> UpdateTaskAsync(int id, UpdateTaskRequestDto request, int userId, string userRole);

        /// <summary>
        /// Deletes a task.
        /// </summary>
        /// <param name="id">Task ID</param>
        /// <param name="userId">User ID from JWT token (for authorization)</param>
        /// <param name="userRole">User role from JWT token (for authorization)</param>
        /// <exception cref="KeyNotFoundException">Task not found</exception>
        /// <exception cref="UnauthorizedAccessException">User not authorized</exception>
        Task DeleteTaskAsync(int id, int userId, string userRole);
    }
}
