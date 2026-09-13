using TrackManagement.Domain.Common;
using TrackManagement.Domain.Enums;

namespace TrackManagement.Domain.Entities;

public class Track : AuditableEntity
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public required string Isrc { get; set; }
    public DateOnly ReleaseDate { get; set; }
    public TrackStatus Status { get; set; }

    public Guid ArtistId { get; set; }
    public Artist Artist { get; set; } = null!;

    public Guid GenreId { get; set; }
    public Genre Genre { get; set; } = null!;

    public TrackMetadata? Metadata { get; set; }
    public ICollection<TrackDistribution> Distributions { get; set; } = [];
    public ICollection<TrackStatusHistory> StatusHistory { get; set; } = [];
}
