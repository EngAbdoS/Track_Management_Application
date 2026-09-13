using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Domain.Common;
using TrackManagement.Domain.Entities;
using TrackManagement.Domain.Entities.Auth;

namespace TrackManagement.Infrastructure.Persistence;

public class ApplicationDbContext(
    DbContextOptions<ApplicationDbContext> options,
    ICurrentUserService currentUserService,
    TimeProvider timeProvider)
    : DbContext(options), IApplicationDbContext
{
    public DbSet<Artist> Artists => Set<Artist>();
    public DbSet<Genre> Genres => Set<Genre>();
    public DbSet<Track> Tracks => Set<Track>();
    public DbSet<TrackMetadata> TrackMetadata => Set<TrackMetadata>();
    public DbSet<Dsp> Dsps => Set<Dsp>();
    public DbSet<TrackDistribution> TrackDistributions => Set<TrackDistribution>();
    public DbSet<TrackStatusHistory> TrackStatusHistories => Set<TrackStatusHistory>();

    public DbSet<TrackDistributionStatusHistory> TrackDistributionStatusHistories =>
        Set<TrackDistributionStatusHistory>();

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ApplyAuditInformation();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        ApplyAuditInformation();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void ApplyAuditInformation()
    {
        var now = timeProvider.GetUtcNow();
        var userId = currentUserService.UserId;

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.CreatedByUserId = userId;
                    break;

                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedByUserId = userId;
                    break;

                // Deletes never reach the database: rewrite to an update that sets the flag.
                case EntityState.Deleted:
                    entry.State = EntityState.Modified;
                    entry.Entity.IsDeleted = true;
                    entry.Entity.DeletedAt = now;
                    entry.Entity.DeletedByUserId = userId;
                    break;
            }
        }
    }
}
