using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using TrackManagement.Domain.Exceptions;

namespace TrackManagement.Api.Middleware;

public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var problem = exception switch
        {
            ValidationException validation => CreateValidationProblem(validation),
            NotFoundException => CreateProblem(StatusCodes.Status404NotFound, "Not found", exception.Message),
            ConflictException => CreateProblem(StatusCodes.Status409Conflict, "Conflict", exception.Message),
            _ => null
        };

        if (problem is null)
        {
            // Nothing here is safe to show a caller, so log it and return a bare 500.
            logger.LogError(exception, "Unhandled exception processing {Path}", httpContext.Request.Path);

            problem = CreateProblem(
                StatusCodes.Status500InternalServerError,
                "Server error",
                "An unexpected error occurred.");
        }

        httpContext.Response.StatusCode = problem.Status!.Value;
        await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken);

        return true;
    }

    private static ProblemDetails CreateProblem(int status, string title, string detail) =>
        new()
        {
            Status = status,
            Title = title,
            Detail = detail
        };

    private static ValidationProblemDetails CreateValidationProblem(ValidationException exception)
    {
        var errors = exception.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

        return new ValidationProblemDetails(errors)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Validation failed"
        };
    }
}
