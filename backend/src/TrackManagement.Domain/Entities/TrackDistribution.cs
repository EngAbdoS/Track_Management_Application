using TrackManagement.Domain.Common;
using TrackManagement.Domain.Enums;

namespace TrackManagement.Domain.Entities;

public class TrackDistribution : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid TrackId { get; set; }
    public Track Track { get; set; } = null!;

    public Guid DspId { get; set; }
    public Dsp Dsp { get; set; } = null!;

    public DateTimeOffset SubmittedAt { get; set; }
    public DistributionStatus Status { get; set; }

    public ICollection<TrackDistributionStatusHistory> StatusHistory { get; set; } = [];
}
