using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrackManagement.Domain.Entities;

namespace TrackManagement.Infrastructure.Persistence.Configurations;

public class TrackDistributionStatusHistoryConfiguration
    : IEntityTypeConfiguration<TrackDistributionStatusHistory>
{
    public void Configure(EntityTypeBuilder<TrackDistributionStatusHistory> builder)
    {
        builder.HasKey(h => h.Id);

        builder.Property(h => h.OldStatus).HasConversion<string>().HasMaxLength(20);
        builder.Property(h => h.NewStatus).HasConversion<string>().HasMaxLength(20);
        builder.Property(h => h.Source).HasConversion<string>().HasMaxLength(30);
        builder.Property(h => h.Reason).HasMaxLength(1000);

        builder.HasIndex(h => new { h.TrackDistributionId, h.ChangedAt });

        builder.HasOne(h => h.ChangedByUser)
            .WithMany()
            .HasForeignKey(h => h.ChangedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(h => !h.TrackDistribution.IsDeleted);
    }
}
