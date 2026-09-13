using TrackManagement.Api;
using TrackManagement.Application;
using TrackManagement.Infrastructure;
using TrackManagement.Infrastructure.Persistence.Seed;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApi(builder.Configuration);

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        // Sample data is a convenience, not a prerequisite — a seeding failure is logged loudly
        // but must not stop the API from starting.
        try
        {
            await scope.ServiceProvider.GetRequiredService<DbSeeder>().SeedAsync();
        }
        catch (Exception exception)
        {
            scope.ServiceProvider
                .GetRequiredService<ILogger<Program>>()
                .LogError(exception, "Database seeding failed; continuing without sample data.");
        }
    }

    app.UseSwagger();
    app.UseSwaggerUI(options => options.SwaggerEndpoint("/swagger/v1/swagger.json", "Track Management API v1"));
}

app.UseHttpsRedirection();
app.UseCors(TrackManagement.Api.DependencyInjection.CorsPolicyName);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
