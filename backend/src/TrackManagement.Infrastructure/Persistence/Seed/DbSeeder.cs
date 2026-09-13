using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Application.Common.Text;
using TrackManagement.Domain.Entities;
using TrackManagement.Domain.Entities.Auth;
using TrackManagement.Domain.Enums;

namespace TrackManagement.Infrastructure.Persistence.Seed;

public class DbSeeder(
    ApplicationDbContext context,
    IPasswordHasher passwordHasher,
    IArabicAwareNormalizer normalizer,
    TimeProvider timeProvider)
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var users = await SeedUsersAsync(cancellationToken);
        var dsps = await SeedDspsAsync(cancellationToken);
        var genres = await SeedGenresAsync(cancellationToken);
        var artists = await SeedArtistsAsync(cancellationToken);

        // Seeded history has to be attributed to someone: ChangedByUserId is a required FK, unlike
        // the nullable audit columns, which stay null to mark rows as system-created.
        await SeedTracksAsync(users[Role.Distributor], dsps, genres, artists, cancellationToken);

        await context.SaveChangesAsync(cancellationToken);
    }

    private async Task<Dictionary<Role, Guid>> SeedUsersAsync(CancellationToken cancellationToken)
    {
        var existing = await context.Users
            .ToDictionaryAsync(u => u.Username, u => u, cancellationToken);

        Dictionary<Role, Guid> byRole = [];

        foreach (var seed in SeedData.Users)
        {
            if (existing.TryGetValue(seed.Username, out var found))
            {
                byRole[seed.Role] = found.Id;
                continue;
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = seed.Username,
                PasswordHash = passwordHasher.Hash(seed.Password),
                Role = seed.Role
            };

            context.Users.Add(user);
            byRole[seed.Role] = user.Id;
        }

        return byRole;
    }

    private async Task<Dictionary<string, Guid>> SeedDspsAsync(CancellationToken cancellationToken)
    {
        var byName = await context.Dsps.ToDictionaryAsync(d => d.Name, d => d.Id, cancellationToken);

        foreach (var name in SeedData.Dsps.Where(n => !byName.ContainsKey(n)))
        {
            var dsp = new Dsp { Id = Guid.NewGuid(), Name = name };
            context.Dsps.Add(dsp);
            byName[name] = dsp.Id;
        }

        return byName;
    }

    private async Task<Dictionary<string, Guid>> SeedGenresAsync(CancellationToken cancellationToken)
    {
        // Keyed on the normalized form, matching how CreateGenre detects duplicates, so a genre
        // already added through the API is reused rather than duplicated under another spelling.
        var byKey = await context.Genres
            .ToDictionaryAsync(g => g.NormalizedKey, g => g.Id, cancellationToken);

        Dictionary<string, Guid> byName = [];

        foreach (var name in SeedData.Genres)
        {
            var key = normalizer.Normalize(name);

            if (!byKey.TryGetValue(key, out var id))
            {
                id = Guid.NewGuid();
                context.Genres.Add(new Genre { Id = id, Name = name, NormalizedKey = key });
                byKey[key] = id;
            }

            byName[name] = id;
        }

        return byName;
    }

    private async Task<Dictionary<string, Guid>> SeedArtistsAsync(CancellationToken cancellationToken)
    {
        // Grouped rather than ToDictionaryAsync: the unique index on Email is newer than some
        // databases, so duplicates can still exist and must not stop the seeder dead.
        var byEmail = (await context.Artists
                .Select(a => new { a.Email, a.Id })
                .ToListAsync(cancellationToken))
            .GroupBy(a => a.Email)
            .ToDictionary(group => group.Key, group => group.First().Id);

        foreach (var seed in SeedData.Artists.Where(a => !byEmail.ContainsKey(a.Email)))
        {
            var artist = new Artist
            {
                Id = Guid.NewGuid(),
                Name = seed.Name,
                Email = seed.Email,
                Country = seed.Country
            };

            context.Artists.Add(artist);
            byEmail[seed.Email] = artist.Id;
        }

        return byEmail;
    }

    private async Task SeedTracksAsync(
        Guid actingUserId,
        Dictionary<string, Guid> dsps,
        Dictionary<string, Guid> genres,
        Dictionary<string, Guid> artists,
        CancellationToken cancellationToken)
    {
        var existingIsrcs = await context.Tracks
            .Select(t => t.Isrc)
            .ToListAsync(cancellationToken);

        var now = timeProvider.GetUtcNow();
        var createdAt = now.AddDays(-45);
        var submittedAt = now.AddDays(-30);
        var distributedAt = now.AddDays(-20);
        var reviewedAt = now.AddDays(-5);

        foreach (var seed in SeedData.Tracks.Where(t => !existingIsrcs.Contains(t.Isrc)))
        {
            var track = new Track
            {
                Id = Guid.NewGuid(),
                Title = seed.Title,
                ArtistId = artists[seed.ArtistEmail],
                GenreId = genres[seed.GenreName],
                Isrc = seed.Isrc,
                ReleaseDate = seed.ReleaseDate,
                Status = seed.Status
            };

            context.Tracks.Add(track);

            AddTrackHistory(track, actingUserId, createdAt, submittedAt, distributedAt);

            foreach (var seedDistribution in seed.Distributions)
            {
                AddDistribution(track, seedDistribution, dsps, actingUserId, distributedAt, reviewedAt);
            }
        }
    }

    /// <summary>Replays how the track reached its status, so the trail matches the current value.</summary>
    private void AddTrackHistory(
        Track track,
        Guid actingUserId,
        DateTimeOffset createdAt,
        DateTimeOffset submittedAt,
        DateTimeOffset distributedAt)
    {
        AddTrackStatusRow(track.Id, null, TrackStatus.Draft, StatusChangeSource.Created, null, actingUserId, createdAt);

        if (track.Status is TrackStatus.Submitted or TrackStatus.Distributed)
        {
            AddTrackStatusRow(track.Id, TrackStatus.Draft, TrackStatus.Submitted,
                StatusChangeSource.ManualUpdate, "Cleared internal review", actingUserId, submittedAt);
        }

        if (track.Status is TrackStatus.Distributed)
        {
            AddTrackStatusRow(track.Id, TrackStatus.Submitted, TrackStatus.Distributed,
                StatusChangeSource.DistributeAction, null, actingUserId, distributedAt);
        }
    }

    private void AddTrackStatusRow(
        Guid trackId,
        TrackStatus? oldStatus,
        TrackStatus newStatus,
        StatusChangeSource source,
        string? reason,
        Guid actingUserId,
        DateTimeOffset changedAt) =>
        context.TrackStatusHistories.Add(new TrackStatusHistory
        {
            Id = Guid.NewGuid(),
            TrackId = trackId,
            OldStatus = oldStatus,
            NewStatus = newStatus,
            Reason = reason,
            Source = source,
            ChangedByUserId = actingUserId,
            ChangedAt = changedAt
        });

    private void AddDistribution(
        Track track,
        SeedData.SeedDistribution seed,
        Dictionary<string, Guid> dsps,
        Guid actingUserId,
        DateTimeOffset distributedAt,
        DateTimeOffset reviewedAt)
    {
        var distribution = new TrackDistribution
        {
            Id = Guid.NewGuid(),
            TrackId = track.Id,
            DspId = dsps[seed.DspName],
            SubmittedAt = distributedAt,
            Status = seed.Status
        };

        context.TrackDistributions.Add(distribution);

        context.TrackDistributionStatusHistories.Add(new TrackDistributionStatusHistory
        {
            Id = Guid.NewGuid(),
            TrackDistributionId = distribution.Id,
            OldStatus = null,
            NewStatus = DistributionStatus.Pending,
            Source = StatusChangeSource.DistributeAction,
            ChangedByUserId = actingUserId,
            ChangedAt = distributedAt
        });

        // Anything past Pending got there by someone acting on a DSP response.
        if (seed.Status != DistributionStatus.Pending)
        {
            context.TrackDistributionStatusHistories.Add(new TrackDistributionStatusHistory
            {
                Id = Guid.NewGuid(),
                TrackDistributionId = distribution.Id,
                OldStatus = DistributionStatus.Pending,
                NewStatus = seed.Status,
                Reason = seed.Reason,
                Source = StatusChangeSource.ManualUpdate,
                ChangedByUserId = actingUserId,
                ChangedAt = reviewedAt
            });
        }
    }
}
