using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrackManagement.Domain.Entities;

namespace TrackManagement.Infrastructure.Persistence.Configurations;

public class DspConfiguration : AuditableEntityConfiguration<Dsp>
{
    protected override void ConfigureEntity(EntityTypeBuilder<Dsp> builder)
    {
        builder.HasKey(d => d.Id);

        builder.Property(d => d.Name).IsRequired().HasMaxLength(100);

        builder.HasIndex(d => d.Name)
            .IsUnique()
            .HasFilter("\"IsDeleted\" = 0");
    }
}
