using MediatR;
using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Artists.Dtos;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Domain.Exceptions;

namespace TrackManagement.Application.Artists.Queries.GetArtistById;

public sealed record GetArtistByIdQuery(Guid Id) : IRequest<ArtistDto>;

public class GetArtistByIdQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetArtistByIdQuery, ArtistDto>
{
    public async Task<ArtistDto> Handle(GetArtistByIdQuery request, CancellationToken cancellationToken)
    {
        var artist = await context.Artists
            .Where(a => a.Id == request.Id)
            .Select(a => new ArtistDto(a.Id, a.Name, a.Email, a.Country))
            .FirstOrDefaultAsync(cancellationToken);

        return artist ?? throw new NotFoundException("Artist", request.Id);
    }
}
