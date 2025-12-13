using TaskCollaborationApp.API.Controllers.DTOs.User;

namespace TaskCollaborationApp.API.Services.Interfaces
{
    /// <summary>
    /// User service contract.
    /// Handles user retrieval operations for task assignment.
    /// </summary>
    public interface IUserService
    {
        /// <summary>
        /// Gets all users for assignment dropdowns.
        /// </summary>
        /// <returns>List of users with id, name, and initials</returns>
        Task<IEnumerable<UserListItemDto>> GetAllUsersAsync();

        /// <summary>
        /// Gets a single user by ID.
        /// </summary>
        /// <param name="id">User ID</param>
        /// <returns>User details or null if not found</returns>
        Task<UserResponseDto?> GetUserByIdAsync(int id);
    }
}
