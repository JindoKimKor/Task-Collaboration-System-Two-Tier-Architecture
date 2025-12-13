using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TaskCollaborationApp.API.Controllers.DTOs.Common;
using TaskCollaborationApp.API.Controllers.DTOs.Task;
using TaskCollaborationApp.API.Services.Interfaces;
using TaskStatus = TaskCollaborationApp.API.Data.Entities.TaskStatus;

namespace TaskCollaborationApp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;

        public TasksController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        /// <summary>
        /// Get all tasks with optional filtering and pagination.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(TaskListResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetTasks(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? status = null,
            [FromQuery] int? assignedTo = null,
            [FromQuery] int? createdBy = null,
            [FromQuery] string? search = null)
        {
            TaskStatus? taskStatus = null;
            if (!string.IsNullOrEmpty(status) && Enum.TryParse<TaskStatus>(status, out var parsed))
            {
                taskStatus = parsed;
            }

            var result = await _taskService.GetTasksAsync(
                page, pageSize, taskStatus, assignedTo, createdBy, search);

            return Ok(result);
        }

        /// <summary>
        /// Get a single task by ID.
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(TaskResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetTask(int id)
        {
            var (task, cacheHit) = await _taskService.GetTaskByIdAsync(id);

            // Set X-Cache header
            Response.Headers["X-Cache"] = cacheHit ? "HIT" : "MISS";

            if (task == null)
            {
                return NotFound(new ErrorResponseDto
                {
                    Error = "Not found",
                    Message = "Task not found"
                });
            }

            return Ok(task);
        }

        /// <summary>
        /// Get tasks created by the current user.
        /// </summary>
        [HttpGet("my")]
        [ProducesResponseType(typeof(TaskListResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetMyTasks(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var userId = GetCurrentUserId();
            var result = await _taskService.GetMyTasksAsync(userId, page, pageSize);
            return Ok(result);
        }

        /// <summary>
        /// Get tasks assigned to the current user.
        /// </summary>
        [HttpGet("assigned")]
        [ProducesResponseType(typeof(TaskListResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetAssignedTasks(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var userId = GetCurrentUserId();
            var result = await _taskService.GetAssignedTasksAsync(userId, page, pageSize);
            return Ok(result);
        }

        /// <summary>
        /// Create a new task.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(TaskResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> CreateTask([FromBody] CreateTaskRequestDto request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _taskService.CreateTaskAsync(request, userId);
                return CreatedAtAction(nameof(GetTask), new { id = result.Id }, result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ErrorResponseDto
                {
                    Error = "Validation failed",
                    Message = ex.Message
                });
            }
        }

        /// <summary>
        /// Update an existing task.
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(TaskResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateTaskRequestDto request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();
                var result = await _taskService.UpdateTaskAsync(id, request, userId, userRole);
                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new ErrorResponseDto
                {
                    Error = "Not found",
                    Message = "Task not found"
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ErrorResponseDto
                {
                    Error = "Forbidden",
                    Message = ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ErrorResponseDto
                {
                    Error = "Validation failed",
                    Message = ex.Message
                });
            }
        }

        /// <summary>
        /// Delete a task.
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteTask(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();
                await _taskService.DeleteTaskAsync(id, userId, userRole);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new ErrorResponseDto
                {
                    Error = "Not found",
                    Message = "Task not found"
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ErrorResponseDto
                {
                    Error = "Forbidden",
                    Message = ex.Message
                });
            }
        }

        /// <summary>
        /// Extracts user ID from JWT claims.
        /// </summary>
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            return int.Parse(userIdClaim!.Value);
        }

        /// <summary>
        /// Extracts user role from JWT claims.
        /// </summary>
        private string GetCurrentUserRole()
        {
            var roleClaim = User.FindFirst(ClaimTypes.Role);
            return roleClaim?.Value ?? "User";
        }
    }
}
