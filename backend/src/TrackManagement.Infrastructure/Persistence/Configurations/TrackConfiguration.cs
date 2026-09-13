using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrackManagement.Domain.Entities;

namespace TrackManagement.Infrastructure.Persistence.Configurations;

public class TrackConfiguration : AuditableEntityConfiguration<Track>
{
    protected override void ConfigureEntity(EntityTypeBuilder<Track> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Title).IsRequired().HasMaxLength(300);
        builder.Property(t => t.Isrc).IsRequired().HasMaxLength(12);
        builder.Property(t => t.Status).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(t => t.Isrc)
            .IsUnique()
            .HasFilter("\"IsDeleted\" = 0");

        builder.HasOne(t => t.Metadata)
            .WithOne(m => m.Track)
            .HasForeignKey<TrackMetadata>(m => m.TrackId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.Distributions)
            .WithOne(d => d.Track)
            .HasForeignKey(d => d.TrackId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.StatusHistory)
            .WithOne(h => h.Track)
            .HasForeignKey(h => h.TrackId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
