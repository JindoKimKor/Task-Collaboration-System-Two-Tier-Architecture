using TaskCollaborationApp.API.Data.Entities;

namespace TaskCollaborationApp.API.Services.Interfaces
{
    /// <summary>
    /// JWT token service contract.
    /// Handles JWT token generation for authenticated users.
    /// Separated from AuthService for Single Responsibility Principle.
    /// </summary>
    public interface IJwtService
    {
        /// <summary>
        /// Generates a JWT token for the specified user.
        /// Token includes user ID, email, username, and role as claims.
        /// </summary>
        /// <param name="user">The authenticated user entity</param>
        /// <returns>JWT token string</returns>
        string GenerateToken(User user);
    }
}
