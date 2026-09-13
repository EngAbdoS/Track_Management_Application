using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrackManagement.Domain.Entities;

namespace TrackManagement.Infrastructure.Persistence.Configurations;

public class GenreConfiguration : AuditableEntityConfiguration<Genre>
{
    protected override void ConfigureEntity(EntityTypeBuilder<Genre> builder)
    {
        builder.HasKey(g => g.Id);

        builder.Property(g => g.Name).IsRequired().HasMaxLength(100);
        builder.Property(g => g.NormalizedKey).IsRequired().HasMaxLength(100);

        // Filtered: a soft-deleted genre must not keep its name reserved forever.
        builder.HasIndex(g => g.NormalizedKey)
            .IsUnique()
            .HasFilter("\"IsDeleted\" = 0");

        builder.HasMany(g => g.Tracks)
            .WithOne(t => t.Genre)
            .HasForeignKey(t => t.GenreId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
