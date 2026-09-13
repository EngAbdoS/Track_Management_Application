using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Common.Interfaces;

namespace TrackManagement.Application.Auth.Commands.Logout;

public sealed record LogoutCommand(string RefreshToken) : IRequest;

public class LogoutCommandValidator : AbstractValidator<LogoutCommand>
{
    public LogoutCommandValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}

public class LogoutCommandHandler(
    IApplicationDbContext context,
    ITokenService tokenService,
    ICurrentUserService currentUserService,
    TimeProvider timeProvider) : IRequestHandler<LogoutCommand>
{
    public async Task Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var hash = tokenService.HashRefreshToken(request.RefreshToken);

        var token = await context.RefreshTokens
            .FirstOrDefaultAsync(
                t => t.TokenHash == hash && t.UserId == currentUserService.UserId,
                cancellationToken);

        // Revoking an unknown or already-revoked token is a no-op: logout should never report
        // back whether a given token was real.
        if (token is { RevokedAt: null })
        {
            token.RevokedAt = timeProvider.GetUtcNow();
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
