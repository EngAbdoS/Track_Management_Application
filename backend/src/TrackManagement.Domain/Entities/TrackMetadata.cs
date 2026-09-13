using TrackManagement.Domain.Common;

namespace TrackManagement.Domain.Entities;

/// <summary>Optional 1:1 extension of <see cref="Track"/>. A track can exist without any of this.</summary>
public class TrackMetadata : AuditableEntity
{
    public Guid TrackId { get; set; }
    public Track Track { get; set; } = null!;

    public int? DurationSeconds { get; set; }
    public int? Bpm { get; set; }

    // Identifies the underlying composition, unlike ISRC which identifies this recording of it.
    public string? Iswc { get; set; }

    public string? Language { get; set; }
    public bool IsExplicit { get; set; }
    public string? Label { get; set; }
    public string? CoverArtUrl { get; set; }
    public string? CopyrightLine { get; set; }
}
