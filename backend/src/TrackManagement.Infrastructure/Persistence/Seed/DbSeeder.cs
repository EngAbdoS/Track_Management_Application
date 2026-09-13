using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Domain.Entities;
using TrackManagement.Domain.Entities.Auth;
using TrackManagement.Domain.Enums;

namespace TrackManagement.Infrastructure.Persistence.Seed;

public class DbSeeder(ApplicationDbContext context, IPasswordHasher passwordHasher)
{
    // POST /api/users requires the Distributor role, so without a seeded account there is no way
    // to create the first one. These credentials are development bootstrap only.
    private static readonly (string Username, string Password, Role Role)[] Users =
    [
        ("distributor", "Distributor#123", Role.Distributor),
        ("viewer", "Viewer#123", Role.Viewer)
    ];

    // DSPs are seed-only by design — there is no create endpoint — so this is the only way they
    // come into existence.
    private static readonly string[] Dsps = ["Spotify", "Apple Music", "YouTube"];

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await SeedUsersAsync(cancellationToken);
        await SeedDspsAsync(cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    private async Task SeedDspsAsync(CancellationToken cancellationToken)
    {
        var existing = await context.Dsps
            .Select(d => d.Name)
            .ToListAsync(cancellationToken);

        foreach (var name in Dsps.Where(n => !existing.Contains(n)))
        {
            context.Dsps.Add(new Dsp { Id = Guid.NewGuid(), Name = name });
        }
    }

    private async Task SeedUsersAsync(CancellationToken cancellationToken)
    {
        var existing = await context.Users
            .Select(u => u.Username)
            .ToListAsync(cancellationToken);

        foreach (var (username, password, role) in Users.Where(u => !existing.Contains(u.Username)))
        {
            context.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                Username = username,
                PasswordHash = passwordHasher.Hash(password),
                Role = role
            });
        }
    }
}
