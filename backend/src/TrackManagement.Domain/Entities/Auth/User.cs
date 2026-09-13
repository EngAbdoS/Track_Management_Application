using TrackManagement.Domain.Common;
using TrackManagement.Domain.Enums;

namespace TrackManagement.Domain.Entities.Auth;

public class User : AuditableEntity
{
    public Guid Id { get; set; }
    public required string Username { get; set; }
    public required string PasswordHash { get; set; }
    public Role Role { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}
