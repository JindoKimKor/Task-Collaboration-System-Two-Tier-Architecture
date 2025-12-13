using TaskCollaborationApp.API.Data.Entities;
using TaskStatus = TaskCollaborationApp.API.Data.Entities.TaskStatus;

namespace TaskCollaborationApp.API.Repositories.Interfaces
{
    /// <summary>
    /// Task-specific repository interface extending generic repository.
    /// Provides pagination, filtering, and task-specific query methods.
    /// </summary>
    public interface ITaskRepository : IRepository<TaskItem>
    {
        /// <summary>
        /// Gets paginated tasks with optional filtering.
        /// </summary>
        Task<(IEnumerable<TaskItem> Items, int TotalCount)> GetPagedAsync(
            int page,
            int pageSize,
            TaskStatus? status = null,
            int? assignedToId = null,
            int? createdById = null,
            string? search = null,
            bool includeArchived = false);

        /// <summary>
        /// Gets a task by ID with CreatedBy and AssignedTo navigation properties loaded.
        /// </summary>
        Task<TaskItem?> GetByIdWithDetailsAsync(int id);

        /// <summary>
        /// Gets all tasks created by a specific user.
        /// </summary>
        Task<(IEnumerable<TaskItem> Items, int TotalCount)> GetByCreatorAsync(
            int userId, int page, int pageSize);

        /// <summary>
        /// Gets all tasks assigned to a specific user.
        /// </summary>
        Task<(IEnumerable<TaskItem> Items, int TotalCount)> GetByAssigneeAsync(
            int userId, int page, int pageSize);

        /// <summary>
        /// Gets tasks that are ready to be archived.
        /// Conditions: Status == Done, IsArchived == false, UpdatedAt older than specified delay.
        /// </summary>
        Task<IEnumerable<TaskItem>> GetTasksToArchiveAsync();
    }
}
