using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrackManagement.Domain.Entities;

namespace TrackManagement.Infrastructure.Persistence.Configurations;

public class TrackDistributionConfiguration : AuditableEntityConfiguration<TrackDistribution>
{
    protected override void ConfigureEntity(EntityTypeBuilder<TrackDistribution> builder)
    {
        builder.HasKey(d => d.Id);

        builder.Property(d => d.Status).HasConversion<string>().HasMaxLength(20);

        // One distribution row per track/DSP pair; re-submitting updates it rather than duplicating.
        builder.HasIndex(d => new { d.TrackId, d.DspId })
            .IsUnique()
            .HasFilter("\"IsDeleted\" = 0");

        builder.HasOne(d => d.Dsp)
            .WithMany(dsp => dsp.Distributions)
            .HasForeignKey(d => d.DspId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(d => d.StatusHistory)
            .WithOne(h => h.TrackDistribution)
            .HasForeignKey(h => h.TrackDistributionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
