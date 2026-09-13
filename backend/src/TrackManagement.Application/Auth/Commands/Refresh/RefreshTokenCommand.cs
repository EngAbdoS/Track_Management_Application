using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Auth.Dtos;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Domain.Entities.Auth;
using TrackManagement.Domain.Exceptions;

namespace TrackManagement.Application.Auth.Commands.Refresh;

public sealed record RefreshTokenCommand(string RefreshToken) : IRequest<AuthResponse>;

public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}

public class RefreshTokenCommandHandler(
    IApplicationDbContext context,
    ITokenService tokenService,
    TimeProvider timeProvider) : IRequestHandler<RefreshTokenCommand, AuthResponse>
{
    public async Task<AuthResponse> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var hash = tokenService.HashRefreshToken(request.RefreshToken);
        var now = timeProvider.GetUtcNow();

        var existing = await context.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);

        if (existing is null)
        {
            throw new InvalidCredentialsException();
        }

        // A token that was already rotated away should never be presented again. Seeing one means
        // the token leaked, so every live session for that user is cut rather than just this one.
        if (existing.RevokedAt is not null)
        {
            await RevokeAllActiveTokensAsync(existing.UserId, now, cancellationToken);
            await context.SaveChangesAsync(cancellationToken);
            throw new InvalidCredentialsException();
        }

        if (!existing.IsActiveAt(now))
        {
            throw new InvalidCredentialsException();
        }

        var (rawRefreshToken, refreshTokenHash) = tokenService.CreateRefreshToken();

        var replacement = new Domain.Entities.Auth.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = existing.UserId,
            TokenHash = refreshTokenHash,
            CreatedAt = now,
            ExpiresAt = now.Add(tokenService.RefreshTokenLifetime)
        };

        existing.RevokedAt = now;
        existing.ReplacedByTokenId = replacement.Id;

        context.RefreshTokens.Add(replacement);

        var accessToken = tokenService.CreateAccessToken(existing.User);
        await context.SaveChangesAsync(cancellationToken);

        return new AuthResponse(accessToken.Value, accessToken.ExpiresAt, rawRefreshToken);
    }

    private async Task RevokeAllActiveTokensAsync(Guid userId, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var active = await context.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var token in active)
        {
            token.RevokedAt = now;
        }
    }
}
