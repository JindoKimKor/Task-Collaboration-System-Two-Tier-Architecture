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


    }
}
