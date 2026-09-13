namespace TrackManagement.Domain.Entities.Auth;

public class RefreshToken
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    // SHA-256 of the token. The raw value goes to the client once and is never persisted,
    // so a database leak doesn't hand out usable tokens.
    public required string TokenHash { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }

    // Set when this token is rotated out, forming a chain that makes replay of a
    // superseded token detectable.
    public Guid? ReplacedByTokenId { get; set; }
    public RefreshToken? ReplacedByToken { get; set; }

    public bool IsActiveAt(DateTimeOffset now) => RevokedAt is null && now < ExpiresAt;
}
