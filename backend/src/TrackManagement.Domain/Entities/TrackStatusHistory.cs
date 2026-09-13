using TrackManagement.Domain.Entities.Auth;
using TrackManagement.Domain.Enums;

namespace TrackManagement.Domain.Entities;

public class TrackStatusHistory
{
    public Guid Id { get; set; }

    public Guid TrackId { get; set; }
    public Track Track { get; set; } = null!;

    // Null only on the row written when the track is first created.
    public TrackStatus? OldStatus { get; set; }

    public TrackStatus NewStatus { get; set; }
    public string? Reason { get; set; }
    public StatusChangeSource Source { get; set; }

    public Guid ChangedByUserId { get; set; }
    public User ChangedByUser { get; set; } = null!;
    public DateTimeOffset ChangedAt { get; set; }
}
