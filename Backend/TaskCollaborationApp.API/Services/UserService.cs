using TaskCollaborationApp.API.Controllers.DTOs.User;
using TaskCollaborationApp.API.Repositories.Interfaces;
using TaskCollaborationApp.API.Services.Interfaces;

namespace TaskCollaborationApp.API.Services
{
    /// <summary>
    /// User service implementation.
    /// Handles user retrieval operations for task assignment.
    /// </summary>
    public class UserService : IUserService
    {
        private readonly IUnitOfWork _unitOfWork;

        public UserService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        /// <inheritdoc />
        public async Task<IEnumerable<UserListItemDto>> GetAllUsersAsync()
        {
            var users = await _unitOfWork.Users.GetAllAsync();

            return users.Select(u => new UserListItemDto
            {
                Id = u.Id,
                Name = u.Name,
                Initials = GetInitials(u.Name)
            });
        }

        /// <inheritdoc />
        public async Task<UserResponseDto?> GetUserByIdAsync(int id)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);

            if (user == null)
                return null;

            return new UserResponseDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Initials = GetInitials(user.Name),
                CreatedAt = user.CreatedAt
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
