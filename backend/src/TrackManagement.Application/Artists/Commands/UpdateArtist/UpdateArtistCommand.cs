using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Artists.Dtos;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Application.Common.Validation;
using TrackManagement.Domain.Exceptions;

namespace TrackManagement.Application.Artists.Commands.UpdateArtist;

/// <summary>Request body for PUT; the id comes from the route.</summary>
public sealed record UpdateArtistRequest(string Name, string Email, string Country);

public sealed record UpdateArtistCommand(Guid Id, string Name, string Email, string Country)
    : IRequest<ArtistDto>;

public class UpdateArtistCommandValidator : AbstractValidator<UpdateArtistCommand>
{
    public UpdateArtistCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Country).NotEmpty().MustBeIsoCountryCode();
    }
}

public class UpdateArtistCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateArtistCommand, ArtistDto>
{
    public async Task<ArtistDto> Handle(UpdateArtistCommand request, CancellationToken cancellationToken)
    {
        var artist = await context.Artists
            .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Artist", request.Id);

        var email = request.Email.Trim().ToLowerInvariant();

        // Excluding self, or saving an artist without changing their email would collide with itself.
        var taken = await context.Artists
            .AnyAsync(a => a.Email == email && a.Id != request.Id, cancellationToken);

        if (taken)
        {
            throw new ConflictException($"An artist with email '{email}' already exists.");
        }

        artist.Name = request.Name.Trim();
        artist.Email = email;
        artist.Country = request.Country.ToUpperInvariant();

        await context.SaveChangesAsync(cancellationToken);

        return new ArtistDto(artist.Id, artist.Name, artist.Email, artist.Country);
    }
}
