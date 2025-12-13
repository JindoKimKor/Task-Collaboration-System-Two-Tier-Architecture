namespace TaskCollaborationApp.API.Controllers.DTOs.User
{
    /// <summary>
    /// Response body for a single user detail.
    /// Used for GET /api/users/{id} response.
    /// </summary>
    public class UserResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Initials { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
