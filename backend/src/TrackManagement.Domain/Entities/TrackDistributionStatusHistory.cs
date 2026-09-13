using TrackManagement.Domain.Entities.Auth;
using TrackManagement.Domain.Enums;

namespace TrackManagement.Domain.Entities;

public class TrackDistributionStatusHistory
{
    public Guid Id { get; set; }

    public Guid TrackDistributionId { get; set; }
    public TrackDistribution TrackDistribution { get; set; } = null!;

    // Null only on the row written when the distribution is first created.
    public DistributionStatus? OldStatus { get; set; }

    public DistributionStatus NewStatus { get; set; }
    public string? Reason { get; set; }
    public StatusChangeSource Source { get; set; }

    public Guid ChangedByUserId { get; set; }
    public User ChangedByUser { get; set; } = null!;
    public DateTimeOffset ChangedAt { get; set; }
}
