namespace TaskCollaborationApp.API.Controllers.DTOs.Task
{
    /// <summary>
    /// Lightweight user representation for task responses.
    /// Contains only essential display information.
    /// </summary>
    public class UserSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Initials { get; set; } = string.Empty;
    }
}
