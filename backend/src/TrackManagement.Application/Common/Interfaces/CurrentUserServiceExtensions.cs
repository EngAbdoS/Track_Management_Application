namespace TrackManagement.Application.Common.Interfaces;

public static class CurrentUserServiceExtensions
{
    /// <summary>
    /// For handlers that record who acted. Every such endpoint requires authentication, so a null
    /// user id here means the pipeline is misconfigured rather than that the caller did anything wrong.
    /// </summary>
    public static Guid RequireUserId(this ICurrentUserService currentUserService) =>
        currentUserService.UserId
        ?? throw new InvalidOperationException("This operation requires an authenticated user.");
}
