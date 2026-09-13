using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Domain.Entities;
using TrackManagement.Domain.Enums;
using TrackManagement.Domain.Exceptions;

namespace TrackManagement.Application.Tracks.Commands.DistributeTrack;

/// <summary>Request body for POST; the track id comes from the route.</summary>
public sealed record DistributeTrackRequest(IReadOnlyList<Guid> DspIds);

public sealed record DistributeTrackCommand(Guid TrackId, IReadOnlyList<Guid> DspIds)
    : IRequest<DistributeTrackResult>;

public sealed record DistributeTrackResult(
    Guid TrackId,
    TrackStatus TrackStatus,
    IReadOnlyList<DspSubmissionDto> Submitted,
    IReadOnlyList<DspSubmissionDto> AlreadyDistributed);

public sealed record DspSubmissionDto(Guid DspId, string DspName, DistributionStatus Status);

public class DistributeTrackCommandValidator : AbstractValidator<DistributeTrackCommand>
{
    public DistributeTrackCommandValidator()
    {
        RuleFor(x => x.TrackId).NotEmpty();

        RuleFor(x => x.DspIds)
            .NotEmpty().WithMessage("At least one DSP must be supplied.");

        RuleFor(x => x.DspIds)
            .Must(ids => ids.Distinct().Count() == ids.Count)
            .WithMessage("The same DSP must not appear more than once.")
            .When(x => x.DspIds is { Count: > 0 });
    }
}

public class DistributeTrackCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    TimeProvider timeProvider) : IRequestHandler<DistributeTrackCommand, DistributeTrackResult>
{
    public async Task<DistributeTrackResult> Handle(
        DistributeTrackCommand request,
        CancellationToken cancellationToken)
    {
        var track = await context.Tracks
            .FirstOrDefaultAsync(t => t.Id == request.TrackId, cancellationToken)
            ?? throw new NotFoundException("Track", request.TrackId);

        var dsps = await context.Dsps
            .Where(d => request.DspIds.Contains(d.Id))
            .ToListAsync(cancellationToken);

        if (dsps.Count != request.DspIds.Count)
        {
            var missing = request.DspIds.Except(dsps.Select(d => d.Id)).First();
            throw new NotFoundException("Dsp", missing);
        }

        var existingByDspId = await context.TrackDistributions
            .Where(d => d.TrackId == track.Id)
            .ToDictionaryAsync(d => d.DspId, d => d.Status, cancellationToken);

        var now = timeProvider.GetUtcNow();
        var userId = currentUserService.RequireUserId();

        List<DspSubmissionDto> submitted = [];
        List<DspSubmissionDto> alreadyDistributed = [];

        foreach (var dsp in dsps)
        {
            // Re-submitting to a DSP the track already sits with is a no-op, not an error: a caller
            // can send the full DSP list and only the new ones are acted on.
            if (existingByDspId.TryGetValue(dsp.Id, out var currentStatus))
            {
                alreadyDistributed.Add(new DspSubmissionDto(dsp.Id, dsp.Name, currentStatus));
                continue;
            }

            var distribution = new TrackDistribution
            {
                Id = Guid.NewGuid(),
                TrackId = track.Id,
                DspId = dsp.Id,
                SubmittedAt = now,
                Status = DistributionStatus.Pending
            };

            context.TrackDistributions.Add(distribution);

            context.TrackDistributionStatusHistories.Add(new TrackDistributionStatusHistory
            {
                Id = Guid.NewGuid(),
                TrackDistributionId = distribution.Id,
                OldStatus = null,
                NewStatus = DistributionStatus.Pending,
                Source = StatusChangeSource.DistributeAction,
                ChangedByUserId = userId,
                ChangedAt = now
            });

            submitted.Add(new DspSubmissionDto(dsp.Id, dsp.Name, DistributionStatus.Pending));
        }

        // After this call the track sits with at least one DSP, so it is distributed regardless of
        // whether anything new was submitted. Forward-only: it never regresses, and an unchanged
        // status writes no history row.
        if (track.Status != TrackStatus.Distributed)
        {
            context.TrackStatusHistories.Add(new TrackStatusHistory
            {
                Id = Guid.NewGuid(),
                TrackId = track.Id,
                OldStatus = track.Status,
                NewStatus = TrackStatus.Distributed,
                Source = StatusChangeSource.DistributeAction,
                ChangedByUserId = userId,
                ChangedAt = now
            });

            track.Status = TrackStatus.Distributed;
        }

        await context.SaveChangesAsync(cancellationToken);

        return new DistributeTrackResult(track.Id, track.Status, submitted, alreadyDistributed);
    }
}
