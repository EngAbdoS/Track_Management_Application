using TrackManagement.Domain.Enums;

namespace TrackManagement.Infrastructure.Persistence.Seed;

/// <summary>
/// The sample catalogue, kept declarative so the data reads as data. Entities are matched on their
/// natural keys (email, name, ISRC) so re-running the seeder adds only what is missing.
/// </summary>
internal static class SeedData
{
    internal sealed record SeedUser(string Username, string Password, Role Role);

    internal sealed record SeedArtist(string Name, string Email, string Country);

    internal sealed record SeedDistribution(string DspName, DistributionStatus Status, string? Reason);

    internal sealed record SeedTrack(
        string Title,
        string ArtistEmail,
        string GenreName,
        string Isrc,
        DateOnly ReleaseDate,
        TrackStatus Status,
        SeedDistribution[] Distributions);

    // POST /api/users requires the Distributor role, so without a seeded account there is no way
    // to create the first one. Development bootstrap credentials only.
    internal static readonly SeedUser[] Users =
    [
        new("distributor", "Distributor#123", Role.Distributor),
        new("viewer", "Viewer#123", Role.Viewer)
    ];

    // Seed-only by design — there is no create endpoint for DSPs.
    internal static readonly string[] Dsps = ["Spotify", "Apple Music", "YouTube"];

    // The Arabic pair exercises the normalizer: شعبى typed anywhere resolves to شعبي.
    internal static readonly string[] Genres =
    [
        "Pop", "Rock", "Hip Hop", "Electronic", "Jazz", "Classical", "R&B", "شعبي", "طرب"
    ];

    internal static readonly SeedArtist[] Artists =
    [
        new("Amr Diab", "amr.diab@example.com", "EG"),
        new("Fairuz", "fairuz@example.com", "LB"),
        new("Nadia Ali", "nadia.ali@example.com", "GB"),
        new("Marcus Vaughn", "marcus.vaughn@example.com", "US")
    ];

    internal static readonly SeedTrack[] Tracks =
    [
        // Distributed, with distributions covering every DistributionStatus across the set below.
        new("Tamally Maak", "amr.diab@example.com", "شعبي", "EGA012400001",
            new DateOnly(2024, 3, 15), TrackStatus.Distributed,
            [
                new("Spotify", DistributionStatus.Live, "Accepted by DSP"),
                new("Apple Music", DistributionStatus.Live, "Accepted by DSP"),
                new("YouTube", DistributionStatus.Pending, null)
            ]),

        new("Nour El Ain", "amr.diab@example.com", "Pop", "EGA012400002",
            new DateOnly(2024, 6, 1), TrackStatus.Distributed,
            [
                new("Spotify", DistributionStatus.Live, "Accepted by DSP"),
                new("Apple Music", DistributionStatus.Rejected, "Artwork did not meet specification")
            ]),

        new("Li Beirut", "fairuz@example.com", "طرب", "LBA012300001",
            new DateOnly(2023, 11, 20), TrackStatus.Distributed,
            [
                new("Spotify", DistributionStatus.Paused, "Paused at the label's request"),
                new("YouTube", DistributionStatus.Blocked, "Takedown: copyright claim #4471")
            ]),

        new("Sahar Ya Leil", "fairuz@example.com", "Classical", "LBA012300002",
            new DateOnly(2023, 12, 5), TrackStatus.Distributed,
            [
                new("Spotify", DistributionStatus.Live, "Accepted by DSP"),
                new("Apple Music", DistributionStatus.Live, "Accepted by DSP"),
                new("YouTube", DistributionStatus.Live, "Accepted by DSP")
            ]),

        // Submitted — cleared internally, not yet sent to any DSP.
        new("Midnight Signal", "nadia.ali@example.com", "Electronic", "GBUM72500001",
            new DateOnly(2025, 2, 14), TrackStatus.Submitted, []),

        new("Glass Harbour", "nadia.ali@example.com", "Electronic", "GBUM72500002",
            new DateOnly(2025, 4, 2), TrackStatus.Submitted, []),

        // QM prefix: a US registrant allocation rather than a country code. Rejected by a naive
        // ISO-only validator, which is why IsrcPrefixCodes exists.
        new("Paper Districts", "marcus.vaughn@example.com", "Hip Hop", "QM6MZ2500017",
            new DateOnly(2025, 7, 9), TrackStatus.Submitted, []),

        // Draft — still being worked on.
        new("Low Tide", "marcus.vaughn@example.com", "Jazz", "USRC12500044",
            new DateOnly(2026, 1, 30), TrackStatus.Draft, []),

        new("Second Avenue", "marcus.vaughn@example.com", "R&B", "USRC12500045",
            new DateOnly(2026, 4, 18), TrackStatus.Draft, []),

        new("Hollow Verse", "nadia.ali@example.com", "Rock", "GBUM72600003",
            new DateOnly(2026, 9, 1), TrackStatus.Draft, [])
    ];
}
