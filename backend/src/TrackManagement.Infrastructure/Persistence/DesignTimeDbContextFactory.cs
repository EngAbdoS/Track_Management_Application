using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using TrackManagement.Application.Common.Interfaces;

namespace TrackManagement.Infrastructure.Persistence;

/// <summary>
/// Used only by the `dotnet ef` tooling, which has no DI container to resolve the context's
/// dependencies from. Never constructed at runtime.
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite("Data Source=trackmanagement.db")
            .Options;

        return new ApplicationDbContext(options, new NoCurrentUser(), TimeProvider.System);
    }

    private sealed class NoCurrentUser : ICurrentUserService
    {
        public Guid? UserId => null;
    }
}
