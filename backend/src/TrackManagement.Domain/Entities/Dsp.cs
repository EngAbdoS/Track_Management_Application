using TrackManagement.Domain.Common;

namespace TrackManagement.Domain.Entities;

public class Dsp : AuditableEntity
{
    public Guid Id { get; set; }
    public required string Name { get; set; }

    public ICollection<TrackDistribution> Distributions { get; set; } = [];
}
