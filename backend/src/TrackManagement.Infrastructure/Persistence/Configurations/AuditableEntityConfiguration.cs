using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrackManagement.Domain.Common;

namespace TrackManagement.Infrastructure.Persistence.Configurations;

/// <summary>
/// Applies the soft-delete query filter centrally so no auditable entity can accidentally omit it
/// and start leaking deleted rows into list endpoints.
/// </summary>
public abstract class AuditableEntityConfiguration<T> : IEntityTypeConfiguration<T>
    where T : AuditableEntity
{
    public void Configure(EntityTypeBuilder<T> builder)
    {
        builder.HasQueryFilter(e => !e.IsDeleted);
        ConfigureEntity(builder);
    }

    protected abstract void ConfigureEntity(EntityTypeBuilder<T> builder);
}
