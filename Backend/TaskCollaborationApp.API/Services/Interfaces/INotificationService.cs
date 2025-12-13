using TaskCollaborationApp.API.Controllers.DTOs.Task;

namespace TaskCollaborationApp.API.Services.Interfaces
{
    /// <summary>
    /// Notification service contract.
    /// Handles real-time notifications via SignalR.
    /// </summary>
    public interface INotificationService
    {
        /// <summary>
        /// Notifies all connected clients when a task is created.
        /// </summary>
        /// <param name="task">Created task data</param>
        /// <param name="createdByName">Name of the user who created the task</param>
        Task NotifyTaskCreatedAsync(TaskResponseDto task, string createdByName);

        /// <summary>
        /// Notifies all connected clients when a task is updated.
        /// </summary>
        /// <param name="task">Updated task data</param>
        Task NotifyTaskUpdatedAsync(TaskResponseDto task);

        /// <summary>
        /// Notifies all connected clients when a task is deleted.
        /// </summary>
        /// <param name="taskId">ID of the deleted task</param>
        Task NotifyTaskDeletedAsync(int taskId);

        /// <summary>
        /// Notifies a specific user when a task is assigned to them.
        /// </summary>
        /// <param name="task">Assigned task data</param>
        /// <param name="assignedToUserId">User ID of the assignee</param>
        Task NotifyTaskAssignedAsync(TaskResponseDto task, int assignedToUserId);
    }
}
