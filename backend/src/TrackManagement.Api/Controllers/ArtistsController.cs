using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrackManagement.Application.Artists.Commands.CreateArtist;
using TrackManagement.Application.Artists.Commands.UpdateArtist;
using TrackManagement.Application.Artists.Dtos;
using TrackManagement.Application.Artists.Queries.GetArtistById;
using TrackManagement.Application.Artists.Queries.GetArtists;
using TrackManagement.Application.Common.Pagination;
using TrackManagement.Domain.Enums;

namespace TrackManagement.Api.Controllers;

[ApiController]
[Route("api/artists")]
public class ArtistsController(ISender sender) : ControllerBase
{
    /// <summary>Lists artists alphabetically.</summary>
    [HttpGet]
    [ProducesResponseType<PagedResult<ArtistDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<ArtistDto>>> GetAll(
        [FromQuery] GetArtistsQuery query,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(query, cancellationToken));

    /// <summary>Gets a single artist.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType<ArtistDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ArtistDto>> GetById(Guid id, CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetArtistByIdQuery(id), cancellationToken));

    /// <summary>Creates an artist.</summary>
    [HttpPost]
    [Authorize(Roles = nameof(Role.Distributor))]
    [ProducesResponseType<ArtistDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ArtistDto>> Create(
        CreateArtistCommand command,
        CancellationToken cancellationToken)
    {
        var artist = await sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = artist.Id }, artist);
    }

    /// <summary>Updates an artist's details.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(Role.Distributor))]
    [ProducesResponseType<ArtistDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ArtistDto>> Update(
        Guid id,
        UpdateArtistRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(
            new UpdateArtistCommand(id, request.Name, request.Email, request.Country),
            cancellationToken));
}
