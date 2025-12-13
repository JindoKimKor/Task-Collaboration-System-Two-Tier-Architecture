using TaskCollaborationApp.API.Controllers.DTOs.Task;
using TaskCollaborationApp.API.Data.Entities;
using TaskCollaborationApp.API.Repositories.Interfaces;
using TaskCollaborationApp.API.Services.Interfaces;
using TaskStatus = TaskCollaborationApp.API.Data.Entities.TaskStatus;

namespace TaskCollaborationApp.API.Services
{
    /// <summary>
    /// Task service implementation.
    /// Handles task CRUD operations and business logic.
    /// </summary>
    public class TaskService : ITaskService
    {
        private readonly IUnitOfWork _unitOfWork;

        public TaskService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        /// <inheritdoc />
        public async Task<TaskListResponseDto> GetTasksAsync(
            int page,
            int pageSize,
            TaskStatus? status = null,
            int? assignedToId = null,
            int? createdById = null,
            string? search = null,
            bool includeArchived = false)
        {
            var (items, totalCount) = await _unitOfWork.Tasks.GetPagedAsync(
                page, pageSize, status, assignedToId, createdById, search, includeArchived);

            return new TaskListResponseDto
            {
                Data = items.Select(MapToDto),
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };
        }

        /// <inheritdoc />
        public async Task<TaskResponseDto?> GetTaskByIdAsync(int id)
        {
            var task = await _unitOfWork.Tasks.GetByIdWithDetailsAsync(id);
            return task == null ? null : MapToDto(task);
        }

        /// <inheritdoc />
        public async Task<TaskListResponseDto> GetMyTasksAsync(int userId, int page, int pageSize)
        {
            var (items, totalCount) = await _unitOfWork.Tasks.GetByCreatorAsync(userId, page, pageSize);

            return new TaskListResponseDto
            {
                Data = items.Select(MapToDto),
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };
        }

        /// <inheritdoc />
        public async Task<TaskListResponseDto> GetAssignedTasksAsync(int userId, int page, int pageSize)
        {
            var (items, totalCount) = await _unitOfWork.Tasks.GetByAssigneeAsync(userId, page, pageSize);

            return new TaskListResponseDto
            {
                Data = items.Select(MapToDto),
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };
        }

        /// <inheritdoc />
        public async Task<TaskResponseDto> CreateTaskAsync(CreateTaskRequestDto request, int createdById)
        {
            if (!Enum.TryParse<TaskStatus>(request.Status, out var status))
            {
                throw new InvalidOperationException($"Invalid status: {request.Status}");
            }

            var task = new TaskItem
            {
                Title = request.Title,
                Description = request.Description,
                Status = status,
                CreatedById = createdById,
                AssignedToId = request.AssignedToId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsArchived = false
            };

            await _unitOfWork.Tasks.AddAsync(task);
            await _unitOfWork.SaveChangesAsync();

            // Reload with navigation properties
            var createdTask = await _unitOfWork.Tasks.GetByIdWithDetailsAsync(task.Id);
            return MapToDto(createdTask!);
        }

        /// <inheritdoc />
        public async Task<TaskResponseDto> UpdateTaskAsync(
            int id,
            UpdateTaskRequestDto request,
            int userId,
            string userRole)
        {
            var task = await _unitOfWork.Tasks.GetByIdWithDetailsAsync(id);

            if (task == null)
            {
                throw new KeyNotFoundException("Task not found");
            }

            // Authorization: Only creator or admin can update
            if (task.CreatedById != userId && userRole != "Admin")
            {
                throw new UnauthorizedAccessException("You don't have permission to edit this task");
            }

            if (!Enum.TryParse<TaskStatus>(request.Status, out var status))
            {
                throw new InvalidOperationException($"Invalid status: {request.Status}");
            }

            task.Title = request.Title;
            task.Description = request.Description;
            task.Status = status;
            task.AssignedToId = request.AssignedToId;
            task.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Tasks.EditAsync(task);
            await _unitOfWork.SaveChangesAsync();

            // Reload with navigation properties
            var updatedTask = await _unitOfWork.Tasks.GetByIdWithDetailsAsync(id);
            return MapToDto(updatedTask!);
        }

        /// <inheritdoc />
        public async Task DeleteTaskAsync(int id, int userId, string userRole)
        {
            var task = await _unitOfWork.Tasks.GetByIdAsync(id);

            if (task == null)
            {
                throw new KeyNotFoundException("Task not found");
            }

            // Authorization: Only creator or admin can delete
            if (task.CreatedById != userId && userRole != "Admin")
            {
                throw new UnauthorizedAccessException("You don't have permission to delete this task");
            }

            await _unitOfWork.Tasks.DeleteAsync(task);
            await _unitOfWork.SaveChangesAsync();
        }

        /// <summary>
        /// Maps TaskItem entity to TaskResponseDto.
        /// </summary>
        private static TaskResponseDto MapToDto(TaskItem task)
        {
            return new TaskResponseDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                Status = task.Status.ToString(),
                CreatedBy = new UserSummaryDto
                {
                    Id = task.CreatedBy.Id,
                    Name = task.CreatedBy.Name,
                    Initials = GetInitials(task.CreatedBy.Name)
                },
                AssignedTo = task.AssignedTo == null ? null : new UserSummaryDto
                {
                    Id = task.AssignedTo.Id,
                    Name = task.AssignedTo.Name,
                    Initials = GetInitials(task.AssignedTo.Name)
                },
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt,
                IsArchived = task.IsArchived,
                ArchivedAt = task.ArchivedAt
            };
        }

        /// <summary>
        /// Generates initials from a full name.
        /// Example: "John Doe" -> "JD"
        /// </summary>
        private static string GetInitials(string name)
        {
            var parts = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 0) return "?";
            if (parts.Length == 1) return parts[0][0].ToString().ToUpper();
            return $"{parts[0][0]}{parts[^1][0]}".ToUpper();
        }
    }
}
