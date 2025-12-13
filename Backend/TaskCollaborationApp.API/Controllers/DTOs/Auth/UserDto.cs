namespace TaskCollaborationApp.API.Controllers.DTOs.Auth
{
    /// <summary>
    /// Response DTO for GET /api/auth/me endpoint.
    /// Server returns current authenticated user's information.
    /// </summary>
    public class UserDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
