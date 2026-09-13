using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Application.Tracks.Dtos;
using TrackManagement.Domain.Common;
using TrackManagement.Domain.Entities;
using TrackManagement.Domain.Enums;
using TrackManagement.Domain.Exceptions;

namespace TrackManagement.Application.Tracks.Commands.CreateTrack;

public sealed record CreateTrackCommand(
    string Title,
    Guid ArtistId,
    Guid GenreId,
    string Isrc,
    DateOnly ReleaseDate) : IRequest<TrackDetailDto>;

public class CreateTrackCommandValidator : AbstractValidator<CreateTrackCommand>
{
    public CreateTrackCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.ArtistId).NotEmpty();
        RuleFor(x => x.GenreId).NotEmpty();

        // Future release dates are valid — scheduled releases are routine.
        RuleFor(x => x.ReleaseDate).NotEmpty();

        RuleFor(x => x.Isrc).Custom((isrc, ctx) =>
        {
            if (!Isrc.TryNormalize(isrc, out _, out var error))
            {
                ctx.AddFailure(nameof(CreateTrackCommand.Isrc), error);
            }
        });
    }
}

public class CreateTrackCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    TimeProvider timeProvider) : IRequestHandler<CreateTrackCommand, TrackDetailDto>
{
    public async Task<TrackDetailDto> Handle(CreateTrackCommand request, CancellationToken cancellationToken)
    {
        // The validator has already rejected anything malformed, so this call is only here to get
        // the canonical uppercase, separator-free form to store.
        Isrc.TryNormalize(request.Isrc, out var isrc, out _);

        var artist = await context.Artists
            .FirstOrDefaultAsync(a => a.Id == request.ArtistId, cancellationToken)
            ?? throw new NotFoundException("Artist", request.ArtistId);

        var genre = await context.Genres
            .FirstOrDefaultAsync(g => g.Id == request.GenreId, cancellationToken)
            ?? throw new NotFoundException("Genre", request.GenreId);

        if (await context.Tracks.AnyAsync(t => t.Isrc == isrc, cancellationToken))
        {
            throw new ConflictException($"A track with ISRC '{isrc}' already exists.");
        }

        var now = timeProvider.GetUtcNow();
        var userId = currentUserService.RequireUserId();

        var track = new Track
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            ArtistId = artist.Id,
            GenreId = genre.Id,
            Isrc = isrc,
            ReleaseDate = request.ReleaseDate,
            Status = TrackStatus.Draft
        };

        context.Tracks.Add(track);

        context.TrackStatusHistories.Add(new TrackStatusHistory
        {
            Id = Guid.NewGuid(),
            TrackId = track.Id,
            OldStatus = null,
            NewStatus = TrackStatus.Draft,
            Source = StatusChangeSource.Created,
            ChangedByUserId = userId,
            ChangedAt = now
        });

        await context.SaveChangesAsync(cancellationToken);

        return new TrackDetailDto(
            track.Id, track.Title, track.Isrc, track.ReleaseDate, track.Status,
            artist.Id, artist.Name, genre.Id, genre.Name,
            Metadata: null, Distributions: [], StatusHistory: []);
    }
}
