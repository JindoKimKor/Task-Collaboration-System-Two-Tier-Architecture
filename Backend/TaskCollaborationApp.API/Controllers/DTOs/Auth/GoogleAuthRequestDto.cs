namespace TaskCollaborationApp.API.Controllers.DTOs.Auth
{
    /// <summary>
    /// Google OAuth authentication request
    /// Client sends Google ID token received from Google Sign-In
    /// </summary>
    public class GoogleAuthRequestDto
    {
        /// <summary>
        /// Google ID token (JWT) from Google Sign-In
        /// Contains user info: email, name, picture, etc.
        /// </summary>
        public string IdToken { get; set; } = string.Empty;
    }
}
