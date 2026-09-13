using MediatR;
using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Auth.Dtos;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Domain.Exceptions;

namespace TrackManagement.Application.Auth.Queries.GetCurrentUser;

public sealed record GetCurrentUserQuery : IRequest<UserResponse>;

public class GetCurrentUserQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService) : IRequestHandler<GetCurrentUserQuery, UserResponse>
{
    public async Task<UserResponse> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        // Read the role from the database rather than the token, so a role change takes effect
        // without waiting for the current access token to expire.
        var user = await context.Users
            .Where(u => u.Id == currentUserService.UserId)
            .Select(u => new UserResponse(u.Id, u.Username, u.Role.ToString()))
            .FirstOrDefaultAsync(cancellationToken);

        return user ?? throw new NotFoundException("User", currentUserService.UserId ?? Guid.Empty);
    }
}
