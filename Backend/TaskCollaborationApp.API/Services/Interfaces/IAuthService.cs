using TaskCollaborationApp.API.Controllers.DTOs.Auth;

namespace TaskCollaborationApp.API.Services.Interfaces
{
    /// <summary>
    /// Authentication service contract.
    /// Handles user registration, login, and token generation.
    /// </summary>
    public interface IAuthService
    {
        /// <summary>
        /// Registers a new user with email and password.
        /// Hashes password with BCrypt, assigns role, and returns JWT token.
        /// </summary>
        /// <param name="request">Registration data (username, email, password)</param>
        /// <returns>Login response with JWT token and user info</returns>
        /// <exception cref="InvalidOperationException">Thrown when email or username already exists</exception>
        Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request);

        /// <summary>
        /// Authenticates user with username/email and password.
        /// Verifies password with BCrypt and returns JWT token.
        /// </summary>
        /// <param name="request">Login data (usernameOrEmail, password)</param>
        /// <returns>Login response with JWT token and user info</returns>
        /// <exception cref="UnauthorizedAccessException">Thrown when credentials are invalid</exception>
        Task<LoginResponseDto> LoginAsync(LoginRequestDto request);

        /// <summary>
        /// Gets current authenticated user's information.
        /// Retrieves user from database by ID extracted from JWT claims.
        /// </summary>
        /// <param name="userId">User ID from JWT NameIdentifier claim</param>
        /// <returns>User DTO if found, null if user doesn't exist</returns>
        Task<UserDto?> GetCurrentUserAsync(int userId);

        /// <summary>
        /// Authenticates user with Google ID token.
        /// Validates token with Google, finds or creates user, returns JWT.
        /// </summary>
        /// <param name="idToken">Google ID token from Google Sign-In</param>
        /// <returns>Login response with JWT token and user info</returns>
        /// <exception cref="InvalidOperationException">Thrown when Google token is invalid</exception>
        Task<LoginResponseDto> GoogleAuthAsync(string idToken);
    }
}
