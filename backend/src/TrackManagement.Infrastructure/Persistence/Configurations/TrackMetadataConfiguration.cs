using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrackManagement.Domain.Entities;

namespace TrackManagement.Infrastructure.Persistence.Configurations;

public class TrackMetadataConfiguration : AuditableEntityConfiguration<TrackMetadata>
{
    protected override void ConfigureEntity(EntityTypeBuilder<TrackMetadata> builder)
    {
        builder.HasKey(m => m.TrackId);

        builder.Property(m => m.Iswc).HasMaxLength(15);
        builder.Property(m => m.Language).HasMaxLength(10);
        builder.Property(m => m.Label).HasMaxLength(200);
        builder.Property(m => m.CoverArtUrl).HasMaxLength(2048);
        builder.Property(m => m.CopyrightLine).HasMaxLength(500);
    }
}
