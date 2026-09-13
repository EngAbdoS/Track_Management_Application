using MediatR;
using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Application.Tracks.Dtos;
using TrackManagement.Domain.Exceptions;

namespace TrackManagement.Application.Tracks.Queries.GetTrackById;

public sealed record GetTrackByIdQuery(Guid Id) : IRequest<TrackDetailDto>;

public class GetTrackByIdQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetTrackByIdQuery, TrackDetailDto>
{
    public async Task<TrackDetailDto> Handle(GetTrackByIdQuery request, CancellationToken cancellationToken)
    {
        // Both status trails are projected inline rather than exposed as separate endpoints, per
        // the "embed rather than add endpoints" decision in architecture.md.
        var track = await context.Tracks
            .Where(t => t.Id == request.Id)
            .Select(t => new TrackDetailDto(
                t.Id,
                t.Title,
                t.Isrc,
                t.ReleaseDate,
                t.Status,
                t.ArtistId,
                t.Artist.Name,
                t.GenreId,
                t.Genre.Name,
                t.Metadata == null
                    ? null
                    : new TrackMetadataDto(
                        t.Metadata.DurationSeconds,
                        t.Metadata.Bpm,
                        t.Metadata.Iswc,
                        t.Metadata.Language,
                        t.Metadata.IsExplicit,
                        t.Metadata.Label,
                        t.Metadata.CoverArtUrl,
                        t.Metadata.CopyrightLine),
                t.Distributions
                    .OrderBy(d => d.Dsp.Name)
                    .Select(d => new TrackDistributionDto(
                        d.Id,
                        d.DspId,
                        d.Dsp.Name,
                        d.SubmittedAt,
                        d.Status,
                        d.StatusHistory
                            .Select(h => new StatusChangeDto(
                                h.OldStatus == null ? null : h.OldStatus.ToString(),
                                h.NewStatus.ToString(),
                                h.Reason,
                                h.Source,
                                h.ChangedByUserId,
                                h.ChangedByUser.Username,
                                h.ChangedAt))
                            .ToList()))
                    .ToList(),
                t.StatusHistory
                    .Select(h => new StatusChangeDto(
                        h.OldStatus == null ? null : h.OldStatus.ToString(),
                        h.NewStatus.ToString(),
                        h.Reason,
                        h.Source,
                        h.ChangedByUserId,
                        h.ChangedByUser.Username,
                        h.ChangedAt))
                    .ToList()))
            .FirstOrDefaultAsync(cancellationToken);

        if (track is null)
        {
            throw new NotFoundException("Track", request.Id);
        }

        // SQLite refuses to translate ORDER BY over a DateTimeOffset, so the chronological sort
        // happens after materialisation. A single track's trails are a handful of rows, and the
        // restriction is provider-specific — SQL Server and PostgreSQL order these in SQL.
        return track with
        {
            StatusHistory = [.. track.StatusHistory.OrderBy(h => h.ChangedAt)],
            Distributions =
            [
                .. track.Distributions.Select(d => d with
                {
                    StatusHistory = [.. d.StatusHistory.OrderBy(h => h.ChangedAt)]
                })
            ]
        };
    }
}
