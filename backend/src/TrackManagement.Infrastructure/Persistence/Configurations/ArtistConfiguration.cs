using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrackManagement.Domain.Entities;

namespace TrackManagement.Infrastructure.Persistence.Configurations;

public class ArtistConfiguration : AuditableEntityConfiguration<Artist>
{
    protected override void ConfigureEntity(EntityTypeBuilder<Artist> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Name).IsRequired().HasMaxLength(200);
        builder.Property(a => a.Email).IsRequired().HasMaxLength(256);
        builder.Property(a => a.Country).IsRequired().HasMaxLength(2);

        // Filtered, so a soft-deleted artist doesn't reserve their email address forever.
        builder.HasIndex(a => a.Email)
            .IsUnique()
            .HasFilter("\"IsDeleted\" = 0");

        builder.HasMany(a => a.Tracks)
            .WithOne(t => t.Artist)
            .HasForeignKey(t => t.ArtistId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
