using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Application.Common.Validation;
using TrackManagement.Application.Tracks.Dtos;
using TrackManagement.Domain.Entities;
using TrackManagement.Domain.Exceptions;

namespace TrackManagement.Application.Tracks.Commands.UpsertTrackMetadata;

/// <summary>Request body for PUT; the track id comes from the route.</summary>
public sealed record UpsertTrackMetadataRequest(
    int? DurationSeconds,
    int? Bpm,
    string? Iswc,
    string? Language,
    bool IsExplicit,
    string? Label,
    string? CoverArtUrl,
    string? CopyrightLine);

public sealed record UpsertTrackMetadataCommand(
    Guid TrackId,
    int? DurationSeconds,
    int? Bpm,
    string? Iswc,
    string? Language,
    bool IsExplicit,
    string? Label,
    string? CoverArtUrl,
    string? CopyrightLine) : IRequest<TrackMetadataDto>;

public class UpsertTrackMetadataCommandValidator : AbstractValidator<UpsertTrackMetadataCommand>
{
    public UpsertTrackMetadataCommandValidator()
    {
        RuleFor(x => x.TrackId).NotEmpty();

        // Every field is optional; each rule applies only when a value is actually supplied.
        RuleFor(x => x.DurationSeconds).GreaterThan(0).When(x => x.DurationSeconds.HasValue);
        RuleFor(x => x.Bpm).InclusiveBetween(20, 300).When(x => x.Bpm.HasValue);
        RuleFor(x => x.Iswc).MaximumLength(15);
        RuleFor(x => x.Label).MaximumLength(200);
        RuleFor(x => x.CopyrightLine).MaximumLength(500);
        RuleFor(x => x.CoverArtUrl).MaximumLength(2048).MustBeAbsoluteHttpUrl();

        RuleFor(x => x.Language)
            .Length(2)
            .Matches("^[A-Za-z]{2}$")
            .When(x => !string.IsNullOrWhiteSpace(x.Language))
            .WithMessage("'Language' must be a two-letter ISO 639-1 code.");
    }
}

public class UpsertTrackMetadataCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpsertTrackMetadataCommand, TrackMetadataDto>
{
    public async Task<TrackMetadataDto> Handle(
        UpsertTrackMetadataCommand request,
        CancellationToken cancellationToken)
    {
        var trackExists = await context.Tracks
            .AnyAsync(t => t.Id == request.TrackId, cancellationToken);

        if (!trackExists)
        {
            throw new NotFoundException("Track", request.TrackId);
        }

        var metadata = await context.TrackMetadata
            .FirstOrDefaultAsync(m => m.TrackId == request.TrackId, cancellationToken);

        if (metadata is null)
        {
            metadata = new TrackMetadata { TrackId = request.TrackId };
            context.TrackMetadata.Add(metadata);
        }

        // PUT replaces the resource: omitted fields are cleared, not left at their previous values.
        metadata.DurationSeconds = request.DurationSeconds;
        metadata.Bpm = request.Bpm;
        metadata.Iswc = request.Iswc?.Trim();
        metadata.Language = request.Language?.Trim().ToLowerInvariant();
        metadata.IsExplicit = request.IsExplicit;
        metadata.Label = request.Label?.Trim();
        metadata.CoverArtUrl = request.CoverArtUrl?.Trim();
        metadata.CopyrightLine = request.CopyrightLine?.Trim();

        await context.SaveChangesAsync(cancellationToken);

        return new TrackMetadataDto(
            metadata.DurationSeconds,
            metadata.Bpm,
            metadata.Iswc,
            metadata.Language,
            metadata.IsExplicit,
            metadata.Label,
            metadata.CoverArtUrl,
            metadata.CopyrightLine);
    }
}
