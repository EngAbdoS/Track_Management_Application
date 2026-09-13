using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrackManagement.Application.Common.Pagination;
using TrackManagement.Application.Tracks.Commands.CreateTrack;
using TrackManagement.Application.Tracks.Commands.UpdateTrack;
using TrackManagement.Application.Tracks.Dtos;
using TrackManagement.Application.Tracks.Queries.GetTrackById;
using TrackManagement.Application.Tracks.Queries.GetTracks;
using TrackManagement.Domain.Enums;

namespace TrackManagement.Api.Controllers;

[ApiController]
[Route("api/tracks")]
public class TracksController(ISender sender) : ControllerBase
{
    /// <summary>
    /// Lists tracks with their artist, genre and status. The genre filter accepts either a genre
    /// id or a genre name in any spelling.
    /// </summary>
    [HttpGet]
    [ProducesResponseType<PagedResult<TrackListDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<TrackListDto>>> GetAll(
        [FromQuery] GetTracksQuery query,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(query, cancellationToken));

    /// <summary>Gets a track with its metadata, DSP distribution statuses and status history.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType<TrackDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TrackDetailDto>> GetById(Guid id, CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetTrackByIdQuery(id), cancellationToken));

    /// <summary>Creates a track for an artist. It starts as a draft.</summary>
    [HttpPost]
    [Authorize(Roles = nameof(Role.Distributor))]
    [ProducesResponseType<TrackDetailDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<TrackDetailDto>> Create(
        CreateTrackCommand command,
        CancellationToken cancellationToken)
    {
        var track = await sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = track.Id }, track);
    }

    /// <summary>Updates a track's details. Does not move it to a different artist.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(Role.Distributor))]
    [ProducesResponseType<TrackDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<TrackDetailDto>> Update(
        Guid id,
        UpdateTrackRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(
            new UpdateTrackCommand(id, request.Title, request.GenreId, request.Isrc, request.ReleaseDate),
            cancellationToken));
}
