using TrackManagement.Domain.Common;

namespace TrackManagement.Domain.Entities;

public class Genre : AuditableEntity
{
    public Guid Id { get; set; }
    public required string Name { get; set; }

    // Folded form used for duplicate detection, so that شعبى and شعبي (or "Pop" and "pop")
    // resolve to the same genre. Unique-indexed; Name keeps whatever the user actually typed.
    public required string NormalizedKey { get; set; }

    public ICollection<Track> Tracks { get; set; } = [];
}
