namespace TaskCollaborationApp.API.Controllers.DTOs.Common
{
    /// <summary>
    /// Standardized error response format for API errors.
    /// Used for business logic errors (e.g., duplicate user).
    /// </summary>
    public class ErrorResponseDto
    {
        public string Error { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public object? Details { get; set; }
    }
}
