namespace TaskCollaborationApp.API.Controllers.DTOs.Auth
{
    /// <summary>
    /// Response DTO for login/register operations.
    /// Server returns this after successful authentication.
    /// </summary>
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
