using System.ComponentModel.DataAnnotations;

namespace TaskCollaborationApp.API.Controllers.DTOs.Auth
{
    /// <summary>
    /// Request DTO for user login.
    /// Client sends this data to POST /api/auth/login.
    /// </summary>
    public class LoginRequestDto
    {
        [Required(ErrorMessage = "Username or email is required")]
        public string UsernameOrEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        public string Password { get; set; } = string.Empty;
    }
}
