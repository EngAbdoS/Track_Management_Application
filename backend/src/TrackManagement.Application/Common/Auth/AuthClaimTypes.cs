namespace TrackManagement.Application.Common.Auth;

/// <summary>
/// Short claim names, shared by token creation and token validation. Inbound claim mapping is
/// disabled, so whatever is written here is exactly what is read back.
/// </summary>
public static class AuthClaimTypes
{
    public const string UserId = "sub";
    public const string Username = "unique_name";
    public const string Role = "role";
}
