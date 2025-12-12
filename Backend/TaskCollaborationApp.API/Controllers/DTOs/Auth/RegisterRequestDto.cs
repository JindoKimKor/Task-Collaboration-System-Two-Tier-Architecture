namespace TaskCollaborationApp.API.Controllers.DTOs.Auth
{
    /// <summary>
    /// Request DTO for user registration.
    /// Client sends this data to POST /api/auth/register.
    /// </summary>
    public class RegisterRequestDto
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
