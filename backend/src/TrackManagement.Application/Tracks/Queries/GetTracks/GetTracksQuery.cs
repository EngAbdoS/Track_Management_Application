using MediatR;
using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Application.Common.Pagination;
using TrackManagement.Application.Common.Text;
using TrackManagement.Application.Tracks.Dtos;
using TrackManagement.Domain.Enums;

namespace TrackManagement.Application.Tracks.Queries.GetTracks;

public sealed record GetTracksQuery : PaginationQuery, IRequest<PagedResult<TrackListDto>>
{
    public Guid? ArtistId { get; init; }
    public TrackStatus? Status { get; init; }

    /// <summary>A genre id, or a genre name in any spelling — see the handler.</summary>
    public string? Genre { get; init; }
}

public class GetTracksQueryHandler(
    IApplicationDbContext context,
    IArabicAwareNormalizer normalizer) : IRequestHandler<GetTracksQuery, PagedResult<TrackListDto>>
{
    public async Task<PagedResult<TrackListDto>> Handle(
        GetTracksQuery request,
        CancellationToken cancellationToken)
    {
        var query = context.Tracks.AsQueryable();

        if (request.ArtistId is { } artistId)
        {
            query = query.Where(t => t.ArtistId == artistId);
        }

        if (request.Status is { } status)
        {
            query = query.Where(t => t.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(request.Genre))
        {
            query = ApplyGenreFilter(query, request.Genre);
        }

        return await query
            .OrderBy(t => t.Title)
            .Select(t => new TrackListDto(
                t.Id,
                t.Title,
                t.Isrc,
                t.ReleaseDate,
                t.Status,
                t.ArtistId,
                t.Artist.Name,
                t.GenreId,
                t.Genre.Name))
            .ToPagedResultAsync(request.Page, request.PageSize, cancellationToken);
    }

    private IQueryable<Domain.Entities.Track> ApplyGenreFilter(
        IQueryable<Domain.Entities.Track> query,
        string genre)
    {
        if (Guid.TryParse(genre, out var genreId))
        {
            return query.Where(t => t.GenreId == genreId);
        }

        // Matched on the normalized key rather than the display name, so filtering by شعبى finds
        // tracks tagged شعبي — the same fold that stops duplicate genres being created.
        var normalizedKey = normalizer.Normalize(genre);
        return query.Where(t => t.Genre.NormalizedKey == normalizedKey);
    }
}
