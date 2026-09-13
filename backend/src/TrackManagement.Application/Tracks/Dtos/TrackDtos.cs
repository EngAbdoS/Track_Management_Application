using TrackManagement.Domain.Enums;

namespace TrackManagement.Application.Tracks.Dtos;

/// <summary>Row shape for the track list: artist name, genre and status without extra round trips.</summary>
public sealed record TrackListDto(
    Guid Id,
    string Title,
    string Isrc,
    DateOnly ReleaseDate,
    TrackStatus Status,
    Guid ArtistId,
    string ArtistName,
    Guid GenreId,
    string GenreName);

public sealed record TrackDetailDto(
    Guid Id,
    string Title,
    string Isrc,
    DateOnly ReleaseDate,
    TrackStatus Status,
    Guid ArtistId,
    string ArtistName,
    Guid GenreId,
    string GenreName,
    TrackMetadataDto? Metadata,
    IReadOnlyList<TrackDistributionDto> Distributions,
    IReadOnlyList<StatusChangeDto> StatusHistory);

public sealed record TrackMetadataDto(
    int? DurationSeconds,
    int? Bpm,
    string? Iswc,
    string? Language,
    bool IsExplicit,
    string? Label,
    string? CoverArtUrl,
    string? CopyrightLine);

public sealed record TrackDistributionDto(
    Guid Id,
    Guid DspId,
    string DspName,
    DateTimeOffset SubmittedAt,
    DistributionStatus Status,
    IReadOnlyList<StatusChangeDto> StatusHistory);

/// <summary>One row of either status trail; <see cref="OldStatus"/> is null on the creation entry.</summary>
public sealed record StatusChangeDto(
    string? OldStatus,
    string NewStatus,
    string? Reason,
    StatusChangeSource Source,
    Guid ChangedByUserId,
    string ChangedByUsername,
    DateTimeOffset ChangedAt);
