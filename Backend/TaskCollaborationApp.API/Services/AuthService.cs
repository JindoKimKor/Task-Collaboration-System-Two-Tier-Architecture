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

            // 7. Return response
            return new LoginResponseDto
            {
                Token = token,
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

            // 4. Return response
            return new LoginResponseDto
            {
                Token = token,
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role
            };
        }
    }
}
