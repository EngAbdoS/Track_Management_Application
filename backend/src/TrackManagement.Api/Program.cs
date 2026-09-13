using TrackManagement.Api;
using TrackManagement.Application;
using TrackManagement.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApi(builder.Configuration);

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options => options.SwaggerEndpoint("/swagger/v1/swagger.json", "Track Management API v1"));
}

app.UseHttpsRedirection();
app.UseCors(TrackManagement.Api.DependencyInjection.CorsPolicyName);
app.UseAuthorization();
app.MapControllers();

app.Run();
