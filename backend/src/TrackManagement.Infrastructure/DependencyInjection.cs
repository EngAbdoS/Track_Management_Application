using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Application.Common.Text;
using TrackManagement.Infrastructure.Auth;
using TrackManagement.Infrastructure.Text;
using TrackManagement.Infrastructure.Persistence;
using TrackManagement.Infrastructure.Persistence.Seed;

namespace TrackManagement.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
                               ?? "Data Source=trackmanagement.db";

        services.AddDbContext<ApplicationDbContext>(options => options.UseSqlite(connectionString));

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());
        services.TryAddSingleton(TimeProvider.System);

        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.AddSingleton<IPasswordHasher, PasswordHasherAdapter>();
        services.AddSingleton<ITokenService, JwtTokenService>();
        services.AddSingleton<IArabicAwareNormalizer, ArabicAwareNormalizer>();
        services.AddScoped<DbSeeder>();

        return services;
    }
}
