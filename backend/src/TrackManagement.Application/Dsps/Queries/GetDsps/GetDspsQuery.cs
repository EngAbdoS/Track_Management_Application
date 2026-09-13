using MediatR;
using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Application.Dsps.Dtos;

namespace TrackManagement.Application.Dsps.Queries.GetDsps;

public sealed record GetDspsQuery : IRequest<IReadOnlyList<DspDto>>;

public class GetDspsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetDspsQuery, IReadOnlyList<DspDto>>
{
    public async Task<IReadOnlyList<DspDto>> Handle(GetDspsQuery request, CancellationToken cancellationToken) =>
        await context.Dsps
            .OrderBy(d => d.Name)
            .Select(d => new DspDto(d.Id, d.Name))
            .ToListAsync(cancellationToken);
}
