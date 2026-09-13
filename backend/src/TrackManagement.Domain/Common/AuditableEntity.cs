namespace TrackManagement.Domain.Common;

/// <summary>Audit columns stamped automatically by the DbContext on save — never set these by hand.</summary>
public abstract class AuditableEntity
{
    public DateTimeOffset CreatedAt { get; set; }

    public Guid? CreatedByUserId { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? UpdatedByUserId { get; set; }

    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedByUserId { get; set; }
}
