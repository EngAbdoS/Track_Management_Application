using MediatR;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Application.Common.Pagination;
using TrackManagement.Application.Genres.Dtos;

namespace TrackManagement.Application.Genres.Queries.GetGenres;

public sealed record GetGenresQuery : PaginationQuery, IRequest<PagedResult<GenreDto>>;

public class GetGenresQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetGenresQuery, PagedResult<GenreDto>>
{
    public Task<PagedResult<GenreDto>> Handle(GetGenresQuery request, CancellationToken cancellationToken) =>
        context.Genres
            .OrderBy(g => g.Name)
            .Select(g => new GenreDto(g.Id, g.Name))
            .ToPagedResultAsync(request.Page, request.PageSize, cancellationToken);
}
