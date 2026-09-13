using TrackManagement.Domain.Common;

namespace TrackManagement.Domain.Entities;

public class Artist : AuditableEntity
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required string Country { get; set; }

    public ICollection<Track> Tracks { get; set; } = [];
}
