using System.Collections.Concurrent;
using TaskCollaborationApp.API.Controllers.DTOs.Auth;
using TaskCollaborationApp.API.Data.Entities;
using TaskCollaborationApp.API.Repositories.Interfaces;
using TaskCollaborationApp.API.Services.Interfaces;
using BCryptNet = BCrypt.Net.BCrypt;

namespace TaskCollaborationApp.API.Services
{
    /// <summary>
    /// Authentication service implementation.
    /// </summary>
    public class AuthService : IAuthService
    {
        // In-memory refresh token storage (Key: token, Value: userId and expiry)
        private static readonly ConcurrentDictionary<string, (int UserId, DateTime Expiry)> _refreshTokens = new();

        private readonly IUnitOfWork _unitOfWork;
        private readonly IJwtService _jwtService;
        private readonly IConfiguration _configuration;

        public AuthService(
            IUnitOfWork unitOfWork,
            IJwtService jwtService,
            IConfiguration configuration)
        {
            _unitOfWork = unitOfWork;
            _jwtService = jwtService;
            _configuration = configuration;
        }

        /// <inheritdoc />
        public async Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request)
        {
            // 1. Check for duplicates
            if (await _unitOfWork.Users.ExistsAsync(request.Email, request.Username))
            {
                throw new InvalidOperationException("Email or username already exists.");
            }

            // 2. Hash password
            var passwordHash = BCryptNet.HashPassword(request.Password);

            // 3. Determine role
            var adminEmail = _configuration["AdminEmail"];
            var role = request.Email == adminEmail ? "Admin" : "User";

            // 4. Create user entity
            var user = new User
            {
                Name = request.Name,
                Username = request.Username,
                Email = request.Email,
                PasswordHash = passwordHash,
                Role = role,
                CreatedAt = DateTime.UtcNow
            };

            // 5. Save to database
            await _unitOfWork.Users.AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            // 6. Generate JWT token
            var token = _jwtService.GenerateToken(user);

            // 7. Generate refresh token
            var refreshToken = GenerateRefreshToken(user.Id);

            // 8. Return response
            return new LoginResponseDto
            {
                Token = token,
                RefreshToken = refreshToken,
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role
            };
        }

        /// <inheritdoc />
        public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
        {
            // 1. Find user by username or email
            var user = await _unitOfWork.Users.FindByEmailOrUsernameAsync(request.UsernameOrEmail);

            if (user == null)
            {
                throw new UnauthorizedAccessException("Invalid credentials.");
            }

            // 2. Verify password
            if (!BCryptNet.Verify(request.Password, user.PasswordHash))
            {
                throw new UnauthorizedAccessException("Invalid credentials.");
            }

            // 3. Generate JWT token
            var token = _jwtService.GenerateToken(user);


            // 4. Generate refresh token
            var refreshToken = GenerateRefreshToken(user.Id);

            // 5. Return response
            return new LoginResponseDto
            {
                Token = token,
                RefreshToken = refreshToken,
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role
            };
        }

        /// <inheritdoc />
        public async Task<UserDto?> GetCurrentUserAsync(int userId)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);

            if (user == null) return null;

            return new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            };
        }

        /// <inheritdoc />
        public async Task<LoginResponseDto> GoogleAuthAsync(string idToken)
        {
            // 1. Validate Google ID token
            var payload = await Google.Apis.Auth.GoogleJsonWebSignature.ValidateAsync(idToken);

            // 2. Find existing user by email
            var user = await _unitOfWork.Users.FindByEmailAsync(payload.Email);

            // 3. If user doesn't exist, create new one
            if (user == null)
            {
                // Determine role
                var adminEmail = _configuration["AdminEmail"];
                var role = payload.Email == adminEmail ? "Admin" : "User";

                user = new User
                {
                    Email = payload.Email,
                    Name = payload.Name ?? payload.Email.Split('@')[0],
                    Username = payload.Email.Split('@')[0],
                    PasswordHash = "",  // OAuth users don't have password
                    Role = role,
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.Users.AddAsync(user);
                await _unitOfWork.SaveChangesAsync();
            }

            // 4. Generate JWT token
            var token = _jwtService.GenerateToken(user);

            // 5. Generate refresh token
            var refreshToken = GenerateRefreshToken(user.Id);

            // 6. Return response
            return new LoginResponseDto
            {
                Token = token,
                RefreshToken = refreshToken,
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role
            };
        }

        /// <inheritdoc />
        public async Task<LoginResponseDto> RefreshTokenAsync(string refreshToken)
        {
            // 1. Validate refresh token exists and not expired
            if (!_refreshTokens.TryGetValue(refreshToken, out var tokenData))
            {
                throw new UnauthorizedAccessException("Invalid refresh token.");
            }

            if (tokenData.Expiry < DateTime.UtcNow)
            {
                // Remove expired token
                _refreshTokens.TryRemove(refreshToken, out _);
                throw new UnauthorizedAccessException("Refresh token expired.");
            }

            // 2. Get user from database
            var user = await _unitOfWork.Users.GetByIdAsync(tokenData.UserId);
            if (user == null)
            {
                _refreshTokens.TryRemove(refreshToken, out _);
                throw new UnauthorizedAccessException("User not found.");
            }

            // 3. Remove old refresh token (one-time use)
            _refreshTokens.TryRemove(refreshToken, out _);

            // 4. Generate new JWT token
            var newToken = _jwtService.GenerateToken(user);

            // 5. Generate new refresh token
            var newRefreshToken = GenerateRefreshToken(user.Id);

            // 6. Return response
            return new LoginResponseDto
            {
                Token = newToken,
                RefreshToken = newRefreshToken,
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role
            };
        }

        /// <summary>
        /// Generates a new refresh token and stores it in memory.
        /// </summary>
        /// <param name="userId">The user ID to associate with the token.</param>
        /// <returns>The generated refresh token string.</returns>
        private string GenerateRefreshToken(int userId)
        {
            // 1. Generate random token
            var refreshToken = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");

            // 2. Set expiry (7 days)
            var expiry = DateTime.UtcNow.AddDays(7);

            // 3. Store in dictionary
            _refreshTokens[refreshToken] = (userId, expiry);

            return refreshToken;
        }
    }
}
