using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace TrackManagement.Api.Serialization;

/// <summary>
/// Documents 401 on every endpoint the fallback policy protects. Authentication is applied
/// globally rather than per-action, so without this the only endpoints advertising a 401 would be
/// the handful that happen to declare it by hand.
/// </summary>
public class AuthResponsesOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var allowsAnonymous = context.MethodInfo
            .GetCustomAttributes(inherit: true)
            .Concat(context.MethodInfo.DeclaringType?.GetCustomAttributes(inherit: true) ?? [])
            .OfType<IAllowAnonymous>()
            .Any();

        if (allowsAnonymous)
        {
            return;
        }

        operation.Responses ??= [];

        operation.Responses.TryAdd("401", new OpenApiResponse
        {
            Description = "Missing or invalid access token."
        });
    }
}
