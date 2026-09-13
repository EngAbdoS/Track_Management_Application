using TrackManagement.Domain.Entities.Auth;

namespace TrackManagement.Application.Common.Interfaces;

public interface ITokenService
{
    AccessToken CreateAccessToken(User user);

    /// <summary>Returns the raw token to hand the caller, and the hash to persist.</summary>
    (string RawToken, string TokenHash) CreateRefreshToken();

    string HashRefreshToken(string rawToken);

    TimeSpan RefreshTokenLifetime { get; }
}

public sealed record AccessToken(string Value, DateTimeOffset ExpiresAt);
