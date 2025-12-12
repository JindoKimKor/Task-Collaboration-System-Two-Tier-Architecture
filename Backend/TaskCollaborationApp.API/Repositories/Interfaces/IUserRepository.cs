using TaskCollaborationApp.API.Data.Entities;

namespace TaskCollaborationApp.API.Repositories.Interfaces
{
    /// <summary>
    /// User-specific repository interface extending generic repository.
    /// Provides authentication-related query methods.
    /// </summary>
    public interface IUserRepository : IRepository<User>
    {
        /// <summary>
        /// Finds a user by email address (case-insensitive).
        /// Used for Google OAuth authentication.
        /// </summary>
        Task<User?> FindByEmailAsync(string email);

        /// <summary>
        /// Finds a user by username (case-insensitive).
        /// </summary>
        Task<User?> FindByUsernameAsync(string username);

        /// <summary>
        /// Finds a user by email or username (case-insensitive).
        /// Used for login authentication.
        /// </summary>
        Task<User?> FindByEmailOrUsernameAsync(string emailOrUsername);

        /// <summary>
        /// Checks if a user with the given email or username already exists.
        /// Used for registration validation.
        /// </summary>
        Task<bool> ExistsAsync(string email, string username);
    }
}