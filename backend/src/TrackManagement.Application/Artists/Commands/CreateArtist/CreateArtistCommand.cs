using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Artists.Dtos;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Application.Common.Validation;
using TrackManagement.Domain.Entities;
using TrackManagement.Domain.Exceptions;

namespace TrackManagement.Application.Artists.Commands.CreateArtist;

public sealed record CreateArtistCommand(string Name, string Email, string Country) : IRequest<ArtistDto>;

public class CreateArtistCommandValidator : AbstractValidator<CreateArtistCommand>
{
    public CreateArtistCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Country).NotEmpty().MustBeIsoCountryCode();
    }
}

public class CreateArtistCommandHandler(IApplicationDbContext context)
    : IRequestHandler<CreateArtistCommand, ArtistDto>
{
    public async Task<ArtistDto> Handle(CreateArtistCommand request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (await context.Artists.AnyAsync(a => a.Email == email, cancellationToken))
        {
            throw new ConflictException($"An artist with email '{email}' already exists.");
        }

        var artist = new Artist
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Email = email,
            Country = request.Country.ToUpperInvariant()
        };

        context.Artists.Add(artist);
        await context.SaveChangesAsync(cancellationToken);

        return new ArtistDto(artist.Id, artist.Name, artist.Email, artist.Country);
    }
}
