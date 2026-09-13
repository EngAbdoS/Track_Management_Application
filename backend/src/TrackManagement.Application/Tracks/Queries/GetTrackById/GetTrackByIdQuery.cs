using MediatR;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Application.Tracks.Dtos;

namespace TrackManagement.Application.Tracks.Queries.GetTrackById;

public sealed record GetTrackByIdQuery(Guid Id) : IRequest<TrackDetailDto>;

public class GetTrackByIdQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetTrackByIdQuery, TrackDetailDto>
{
    public Task<TrackDetailDto> Handle(GetTrackByIdQuery request, CancellationToken cancellationToken) =>
        context.GetDetailAsync(request.Id, cancellationToken);
}
