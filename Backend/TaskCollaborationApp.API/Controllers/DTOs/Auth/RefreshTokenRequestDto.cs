namespace TaskCollaborationApp.API.Controllers.DTOs.Auth
{
    /// <summary>
    /// Request DTO for token refresh operation.
    /// Client sends expired access token's refresh token to get new tokens.
    /// </summary>
    public class RefreshTokenRequestDto
    {
        public string RefreshToken { get; set; } = string.Empty;
    }
}
