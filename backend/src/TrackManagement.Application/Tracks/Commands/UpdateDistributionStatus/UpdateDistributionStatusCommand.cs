using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Domain.Entities;
using TrackManagement.Domain.Enums;
using TrackManagement.Domain.Exceptions;

namespace TrackManagement.Application.Tracks.Commands.UpdateDistributionStatus;

/// <summary>Request body for PATCH; track and distribution ids come from the route.</summary>
public sealed record UpdateDistributionStatusRequest(DistributionStatus Status, string? Reason);

public sealed record UpdateDistributionStatusCommand(
    Guid TrackId,
    Guid DistributionId,
    DistributionStatus Status,
    string? Reason) : IRequest<DistributionStatusChangeResult>;

public sealed record DistributionStatusChangeResult(
    Guid DistributionId,
    DistributionStatus Status,
    bool Changed);

public class UpdateDistributionStatusCommandValidator : AbstractValidator<UpdateDistributionStatusCommand>
{
    public UpdateDistributionStatusCommandValidator()
    {
        RuleFor(x => x.TrackId).NotEmpty();
        RuleFor(x => x.DistributionId).NotEmpty();
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.Reason).MaximumLength(1000);
    }
}

public class UpdateDistributionStatusCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    TimeProvider timeProvider)
    : IRequestHandler<UpdateDistributionStatusCommand, DistributionStatusChangeResult>
{
    public async Task<DistributionStatusChangeResult> Handle(
        UpdateDistributionStatusCommand request,
        CancellationToken cancellationToken)
    {
        // Matched on both ids so a distribution belonging to a different track can't be reached
        // through this track's route.
        var distribution = await context.TrackDistributions
            .FirstOrDefaultAsync(
                d => d.Id == request.DistributionId && d.TrackId == request.TrackId,
                cancellationToken)
            ?? throw new NotFoundException("Distribution", request.DistributionId);

        if (distribution.Status == request.Status)
        {
            return new DistributionStatusChangeResult(distribution.Id, distribution.Status, Changed: false);
        }

        context.TrackDistributionStatusHistories.Add(new TrackDistributionStatusHistory
        {
            Id = Guid.NewGuid(),
            TrackDistributionId = distribution.Id,
            OldStatus = distribution.Status,
            NewStatus = request.Status,
            Reason = request.Reason?.Trim(),
            Source = StatusChangeSource.ManualUpdate,
            ChangedByUserId = currentUserService.RequireUserId(),
            ChangedAt = timeProvider.GetUtcNow()
        });

        distribution.Status = request.Status;
        await context.SaveChangesAsync(cancellationToken);

        return new DistributionStatusChangeResult(distribution.Id, distribution.Status, Changed: true);
    }
}
