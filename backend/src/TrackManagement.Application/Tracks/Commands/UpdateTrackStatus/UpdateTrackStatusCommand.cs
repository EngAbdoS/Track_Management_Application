using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Domain.Entities;
using TrackManagement.Domain.Enums;
using TrackManagement.Domain.Exceptions;

namespace TrackManagement.Application.Tracks.Commands.UpdateTrackStatus;

/// <summary>Request body for PATCH; the track id comes from the route.</summary>
public sealed record UpdateTrackStatusRequest(TrackStatus Status, string? Reason);

public sealed record UpdateTrackStatusCommand(Guid Id, TrackStatus Status, string? Reason)
    : IRequest<TrackStatusChangeResult>;

public sealed record TrackStatusChangeResult(Guid TrackId, TrackStatus Status, bool Changed);

public class UpdateTrackStatusCommandValidator : AbstractValidator<UpdateTrackStatusCommand>
{
    public UpdateTrackStatusCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.Reason).MaximumLength(1000);
    }
}

public class UpdateTrackStatusCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    TimeProvider timeProvider) : IRequestHandler<UpdateTrackStatusCommand, TrackStatusChangeResult>
{
    public async Task<TrackStatusChangeResult> Handle(
        UpdateTrackStatusCommand request,
        CancellationToken cancellationToken)
    {
        var track = await context.Tracks
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Track", request.Id);

        // Setting the status it already holds records nothing: a trail of unchanged entries is
        // noise, and the response says whether anything moved.
        if (track.Status == request.Status)
        {
            return new TrackStatusChangeResult(track.Id, track.Status, Changed: false);
        }

        context.TrackStatusHistories.Add(new TrackStatusHistory
        {
            Id = Guid.NewGuid(),
            TrackId = track.Id,
            OldStatus = track.Status,
            NewStatus = request.Status,
            Reason = request.Reason?.Trim(),
            Source = StatusChangeSource.ManualUpdate,
            ChangedByUserId = currentUserService.RequireUserId(),
            ChangedAt = timeProvider.GetUtcNow()
        });

        track.Status = request.Status;
        await context.SaveChangesAsync(cancellationToken);

        return new TrackStatusChangeResult(track.Id, track.Status, Changed: true);
    }
}
