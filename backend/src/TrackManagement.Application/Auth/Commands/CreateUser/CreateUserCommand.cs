using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Auth.Dtos;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Domain.Entities.Auth;
using TrackManagement.Domain.Enums;
using TrackManagement.Domain.Exceptions;

namespace TrackManagement.Application.Auth.Commands.CreateUser;

public sealed record CreateUserCommand(string Username, string Password, Role Role) : IRequest<UserResponse>;

public class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserCommandValidator()
    {
        RuleFor(x => x.Username).NotEmpty().Length(3, 50);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
        RuleFor(x => x.Role).IsInEnum();
    }
}

public class CreateUserCommandHandler(
    IApplicationDbContext context,
    IPasswordHasher passwordHasher) : IRequestHandler<CreateUserCommand, UserResponse>
{
    public async Task<UserResponse> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        var taken = await context.Users
            .AnyAsync(u => u.Username == request.Username, cancellationToken);

        if (taken)
        {
            throw new ConflictException($"Username '{request.Username}' is already taken.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = request.Username,
            PasswordHash = passwordHasher.Hash(request.Password),
            Role = request.Role
        };

        context.Users.Add(user);
        await context.SaveChangesAsync(cancellationToken);

        return new UserResponse(user.Id, user.Username, user.Role.ToString());
    }
}
