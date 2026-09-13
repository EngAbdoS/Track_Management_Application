using Microsoft.OpenApi;
using TrackManagement.Api.Middleware;
using TrackManagement.Api.Services;
using TrackManagement.Application.Common.Interfaces;

namespace TrackManagement.Api;

public static class DependencyInjection
{
    public const string CorsPolicyName = "TrackManagementCors";

    public static IServiceCollection AddApi(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        services.AddProblemDetails();
        services.AddExceptionHandler<GlobalExceptionHandler>();

        services.AddCors(options => options.AddPolicy(CorsPolicyName, policy =>
        {
            var origins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

            policy.WithOrigins(origins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }));

        services.AddSwagger();

        return services;
    }

    private static void AddSwagger(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();

        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Track Management API",
                Version = "v1",
                Description = "Artists, tracks, and their distribution status across DSPs."
            });

            var xmlPath = Path.Combine(AppContext.BaseDirectory, "TrackManagement.Api.xml");
            if (File.Exists(xmlPath))
            {
                options.IncludeXmlComments(xmlPath);
            }

            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Paste the access token returned by /api/auth/login."
            });

            options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
            {
                { new OpenApiSecuritySchemeReference("Bearer", document), [] }
            });
        });
    }
}
