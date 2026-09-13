using MediatR;
using TrackManagement.Application.Artists.Dtos;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Application.Common.Pagination;

namespace TrackManagement.Application.Artists.Queries.GetArtists;

public sealed record GetArtistsQuery : PaginationQuery, IRequest<PagedResult<ArtistDto>>;

public class GetArtistsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetArtistsQuery, PagedResult<ArtistDto>>
{
    public Task<PagedResult<ArtistDto>> Handle(GetArtistsQuery request, CancellationToken cancellationToken) =>
        context.Artists
            .OrderBy(a => a.Name)
            .Select(a => new ArtistDto(a.Id, a.Name, a.Email, a.Country))
            .ToPagedResultAsync(request.Page, request.PageSize, cancellationToken);
}
