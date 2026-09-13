using Microsoft.EntityFrameworkCore;
using TrackManagement.Domain.Entities;
using TrackManagement.Domain.Entities.Auth;

namespace TrackManagement.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Artist> Artists { get; }
    DbSet<Genre> Genres { get; }
    DbSet<Track> Tracks { get; }
    DbSet<TrackMetadata> TrackMetadata { get; }
    DbSet<Dsp> Dsps { get; }
    DbSet<TrackDistribution> TrackDistributions { get; }
    DbSet<TrackStatusHistory> TrackStatusHistories { get; }
    DbSet<TrackDistributionStatusHistory> TrackDistributionStatusHistories { get; }
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
