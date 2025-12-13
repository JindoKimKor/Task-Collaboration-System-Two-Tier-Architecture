namespace TaskCollaborationApp.API.Controllers.DTOs.User
{
    /// <summary>
    /// DTO for user list items in dropdowns and assignment lists.
    /// Used for GET /api/users response.
    /// </summary>
    public class UserListItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Initials { get; set; } = string.Empty;
    }
}
