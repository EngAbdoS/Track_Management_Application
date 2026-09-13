using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Application.Tracks.Dtos;
using TrackManagement.Application.Tracks.Queries;
using TrackManagement.Domain.Common;
using TrackManagement.Domain.Exceptions;

namespace TrackManagement.Application.Tracks.Commands.UpdateTrack;

/// <summary>
/// Request body for PUT. Artist is absent by design: moving a track to a different artist is a
/// catalogue transfer, not an edit, and shouldn't happen as a side effect of renaming something.
/// </summary>
public sealed record UpdateTrackRequest(string Title, Guid GenreId, string Isrc, DateOnly ReleaseDate);

public sealed record UpdateTrackCommand(
    Guid Id,
    string Title,
    Guid GenreId,
    string Isrc,
    DateOnly ReleaseDate) : IRequest<TrackDetailDto>;

public class UpdateTrackCommandValidator : AbstractValidator<UpdateTrackCommand>
{
    public UpdateTrackCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.GenreId).NotEmpty();
        RuleFor(x => x.ReleaseDate).NotEmpty();

        RuleFor(x => x.Isrc).Custom((isrc, ctx) =>
        {
            if (!Isrc.TryNormalize(isrc, out _, out var error))
            {
                ctx.AddFailure(nameof(UpdateTrackCommand.Isrc), error);
            }
        });
    }
}

public class UpdateTrackCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateTrackCommand, TrackDetailDto>
{
    public async Task<TrackDetailDto> Handle(UpdateTrackCommand request, CancellationToken cancellationToken)
    {
        Isrc.TryNormalize(request.Isrc, out var isrc, out _);

        var track = await context.Tracks
            .Include(t => t.Artist)
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Track", request.Id);

        var genre = await context.Genres
            .FirstOrDefaultAsync(g => g.Id == request.GenreId, cancellationToken)
            ?? throw new NotFoundException("Genre", request.GenreId);

        var isrcTaken = await context.Tracks
            .AnyAsync(t => t.Isrc == isrc && t.Id != request.Id, cancellationToken);

        if (isrcTaken)
        {
            throw new ConflictException($"A track with ISRC '{isrc}' already exists.");
        }

        track.Title = request.Title.Trim();
        track.GenreId = genre.Id;
        track.Isrc = isrc;
        track.ReleaseDate = request.ReleaseDate;

        await context.SaveChangesAsync(cancellationToken);

        return await context.GetDetailAsync(track.Id, cancellationToken);
    }
}
