namespace TrackManagement.Application.Auth.Dtos;

public sealed record AuthResponse(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    string RefreshToken);

public sealed record UserResponse(Guid Id, string Username, string Role);
