using Microsoft.AspNetCore.SignalR;
using TaskCollaborationApp.API.Controllers.DTOs.Task;
using TaskCollaborationApp.API.Hubs;
using TaskCollaborationApp.API.Services.Interfaces;

namespace TaskCollaborationApp.API.Services
{
    /// <summary>
    /// Notification service implementation.
    /// Handles real-time notifications via SignalR.
    /// </summary>
    public class NotificationService : INotificationService
    {
        private readonly IHubContext<TaskHub> _hubContext;
        private const string BoardGroup = "TaskBoard";

        public NotificationService(IHubContext<TaskHub> hubContext)
        {
            _hubContext = hubContext;
        }

        /// <inheritdoc />
        public async Task NotifyTaskCreatedAsync(TaskResponseDto task, string createdByName)
        {
            await _hubContext.Clients.Group(BoardGroup)
                .SendAsync("TaskCreated", new { Task = task, CreatedBy = createdByName });
        }

        /// <inheritdoc />
        public async Task NotifyTaskUpdatedAsync(TaskResponseDto task)
        {
            await _hubContext.Clients.Group(BoardGroup)
                .SendAsync("TaskUpdated", new { Task = task });
        }

        /// <inheritdoc />
        public async Task NotifyTaskDeletedAsync(int taskId)
        {
            await _hubContext.Clients.Group(BoardGroup)
                .SendAsync("TaskDeleted", new { TaskId = taskId });
        }

        /// <inheritdoc />
        public async Task NotifyTaskAssignedAsync(TaskResponseDto task, int assignedToUserId)
        {
            await _hubContext.Clients.Group(BoardGroup)
                .SendAsync("TaskAssigned", new { Task = task, AssignedToUserId = assignedToUserId });
        }
    }
}
