using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrackManagement.Domain.Entities;

namespace TrackManagement.Infrastructure.Persistence.Configurations;

public class TrackStatusHistoryConfiguration : IEntityTypeConfiguration<TrackStatusHistory>
{
    public void Configure(EntityTypeBuilder<TrackStatusHistory> builder)
    {
        builder.HasKey(h => h.Id);

        builder.Property(h => h.OldStatus).HasConversion<string>().HasMaxLength(20);
        builder.Property(h => h.NewStatus).HasConversion<string>().HasMaxLength(20);
        builder.Property(h => h.Source).HasConversion<string>().HasMaxLength(30);
        builder.Property(h => h.Reason).HasMaxLength(1000);

        builder.HasIndex(h => new { h.TrackId, h.ChangedAt });

        // Restrict, not the convention default of Cascade: removing a user must never erase
        // the audit trail of what they did.
        builder.HasOne(h => h.ChangedByUser)
            .WithMany()
            .HasForeignKey(h => h.ChangedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Mirrors the parent's soft-delete filter: Track is a required navigation, so without
        // this EF warns that a filtered principal can leave it null.
        builder.HasQueryFilter(h => !h.Track.IsDeleted);
    }
}
