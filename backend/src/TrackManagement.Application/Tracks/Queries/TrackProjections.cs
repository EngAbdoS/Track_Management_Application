using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Application.Tracks.Dtos;
using TrackManagement.Domain.Entities;
using TrackManagement.Domain.Exceptions;

namespace TrackManagement.Application.Tracks.Queries;

/// <summary>
/// One definition of the track detail shape, shared by the query and by the commands that return
/// it. Previously the commands hand-built the DTO and passed empty collections, which was a lie
/// for any track that already had metadata or distributions.
/// </summary>
public static class TrackProjections
{
    public static Expression<Func<Track, TrackDetailDto>> Detail =>
        track => new TrackDetailDto(
            track.Id,
            track.Title,
            track.Isrc,
            track.ReleaseDate,
            track.Status,
            track.ArtistId,
            track.Artist.Name,
            track.GenreId,
            track.Genre.Name,
            track.Metadata == null
                ? null
                : new TrackMetadataDto(
                    track.Metadata.DurationSeconds,
                    track.Metadata.Bpm,
                    track.Metadata.Iswc,
                    track.Metadata.Language,
                    track.Metadata.IsExplicit,
                    track.Metadata.Label,
                    track.Metadata.CoverArtUrl,
                    track.Metadata.CopyrightLine),
            track.Distributions
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
            track.StatusHistory
                .Select(h => new StatusChangeDto(
                    h.OldStatus == null ? null : h.OldStatus.ToString(),
                    h.NewStatus.ToString(),
                    h.Reason,
                    h.Source,
                    h.ChangedByUserId,
                    h.ChangedByUser.Username,
                    h.ChangedAt))
                .ToList());

    public static async Task<TrackDetailDto> GetDetailAsync(
        this IApplicationDbContext context,
        Guid trackId,
        CancellationToken cancellationToken)
    {
        var detail = await context.Tracks
            .Where(t => t.Id == trackId)
            .Select(Detail)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Track", trackId);

        // SQLite refuses to translate ORDER BY over a DateTimeOffset, so the chronological sort
        // happens after materialisation. Provider-specific: SQL Server and PostgreSQL sort in SQL.
        return detail with
        {
            StatusHistory = [.. detail.StatusHistory.OrderBy(h => h.ChangedAt)],
            Distributions =
            [
                .. detail.Distributions.Select(d => d with
                {
                    StatusHistory = [.. d.StatusHistory.OrderBy(h => h.ChangedAt)]
                })
            ]
        };
    }
}
