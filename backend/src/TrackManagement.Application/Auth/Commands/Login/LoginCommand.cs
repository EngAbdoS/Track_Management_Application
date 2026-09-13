using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Auth.Dtos;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Domain.Entities.Auth;
using TrackManagement.Domain.Exceptions;

namespace TrackManagement.Application.Auth.Commands.Login;

public sealed record LoginCommand(string Username, string Password) : IRequest<AuthResponse>;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Username).NotEmpty();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class LoginCommandHandler(
    IApplicationDbContext context,
    IPasswordHasher passwordHasher,
    ITokenService tokenService,
    TimeProvider timeProvider) : IRequestHandler<LoginCommand, AuthResponse>
{
    public async Task<AuthResponse> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Username == request.Username, cancellationToken);

        // Same exception for unknown user and bad password, so the response can't be used to
        // discover which usernames exist.
        if (user is null || !passwordHasher.Verify(user.PasswordHash, request.Password))
        {
            throw new InvalidCredentialsException();
        }

        var accessToken = tokenService.CreateAccessToken(user);
        var (rawRefreshToken, refreshTokenHash) = tokenService.CreateRefreshToken();
        var now = timeProvider.GetUtcNow();

        context.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = refreshTokenHash,
            CreatedAt = now,
            ExpiresAt = now.Add(tokenService.RefreshTokenLifetime)
        });

        await context.SaveChangesAsync(cancellationToken);

        return new AuthResponse(accessToken.Value, accessToken.ExpiresAt, rawRefreshToken);
    }
}
