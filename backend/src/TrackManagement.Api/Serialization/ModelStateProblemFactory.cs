using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace TrackManagement.Api.Serialization;

/// <summary>
/// Shapes model-binding failures like the FluentValidation ones. Binding runs before MediatR, so
/// without this the API answers 400 in two different formats depending on whether the body failed
/// to deserialize or failed a business rule.
/// </summary>
public static class ModelStateProblemFactory
{
    private const string BodyKey = "body";

    public static IActionResult Create(ActionContext context)
    {
        var parameterNames = context.ActionDescriptor.Parameters
            .Select(parameter => parameter.Name)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var entries = context.ModelState
            .Where(entry => entry.Value is { Errors.Count: > 0 })
            .Select(entry => (entry.Key, Messages: entry.Value!.Errors.Select(Describe).ToArray()))
            .ToList();

        // A body that fails to bind also flags the action parameter itself as missing. That's a
        // consequence of the real error, not a second problem, so it only survives alone.
        var specific = entries.Where(entry => !parameterNames.Contains(entry.Key)).ToList();

        var errors = (specific.Count > 0 ? specific : entries)
            .ToDictionary(entry => NormalizeKey(entry.Key), entry => entry.Messages);

        return new BadRequestObjectResult(new ValidationProblemDetails(errors)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Validation failed"
        });
    }

    /// <summary>Turns System.Text.Json's "$.status" path into the "Status" used elsewhere.</summary>
    private static string NormalizeKey(string key)
    {
        if (string.IsNullOrEmpty(key))
        {
            return BodyKey;
        }

        if (!key.StartsWith("$.", StringComparison.Ordinal))
        {
            return key;
        }

        var name = key[2..];

        return name.Length > 0
            ? char.ToUpperInvariant(name[0]) + name[1..]
            : BodyKey;
    }

    private static string Describe(ModelError error) =>
        !string.IsNullOrWhiteSpace(error.ErrorMessage)
            ? StripPathSuffix(error.ErrorMessage)
            : "The value could not be read.";

    /// <summary>
    /// System.Text.Json appends "Path: $.x | LineNumber: 0 | BytePositionInLine: 21" to converter
    /// messages. The field is already identified by the key, and byte offsets help nobody.
    /// </summary>
    private static string StripPathSuffix(string message)
    {
        var index = message.IndexOf(" Path: $", StringComparison.Ordinal);
        return index >= 0 ? message[..index] : message;
    }
}
