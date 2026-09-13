using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using TrackManagement.Api.Middleware;
using TrackManagement.Api.Serialization;
using TrackManagement.Api.Services;
using TrackManagement.Application.Common.Auth;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Infrastructure.Auth;

namespace TrackManagement.Api;

public static class DependencyInjection
{
    public const string CorsPolicyName = "TrackManagementCors";

    public static IServiceCollection AddApi(this IServiceCollection services, IConfiguration configuration)
    {
        // Enums cross the wire as names ("Viewer", "Distributed"), not ordinals — readable for
        // clients, and immune to a reordered enum silently changing meaning.
        services.AddControllers()
            .AddJsonOptions(options =>
                options.JsonSerializerOptions.Converters.Add(new StrictEnumConverterFactory()));

        services.Configure<ApiBehaviorOptions>(options =>
            options.InvalidModelStateResponseFactory = ModelStateProblemFactory.Create);

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
        services.AddJwtAuth(configuration);

        return services;
    }

    private static void AddJwtAuth(this IServiceCollection services, IConfiguration configuration)
    {
        var jwt = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
        jwt.Validate();

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                // Claims are written and read under the same short names; without this, the handler
                // rewrites "sub" and "role" to long URIs and role checks silently stop matching.
                options.MapInboundClaims = false;

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
                    NameClaimType = AuthClaimTypes.Username,
                    RoleClaimType = AuthClaimTypes.Role,
                    ClockSkew = TimeSpan.FromSeconds(30)
                };
            });

        // Authenticated by default; endpoints opt out with [AllowAnonymous].
        services.AddAuthorizationBuilder()
            .SetFallbackPolicy(new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build());
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

            options.OperationFilter<AuthResponsesOperationFilter>();

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
