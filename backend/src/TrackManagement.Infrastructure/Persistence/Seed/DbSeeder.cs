using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Common.Interfaces;
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

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await SeedUsersAsync(cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
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
