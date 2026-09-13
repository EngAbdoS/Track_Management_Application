using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrackManagement.Application.Common.Pagination;
using TrackManagement.Application.Tracks.Commands.CreateTrack;
using TrackManagement.Application.Tracks.Commands.DistributeTrack;
using TrackManagement.Application.Tracks.Commands.UpdateDistributionStatus;
using TrackManagement.Application.Tracks.Commands.UpdateTrack;
using TrackManagement.Application.Tracks.Commands.UpdateTrackStatus;
using TrackManagement.Application.Tracks.Commands.UpsertTrackMetadata;
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

    /// <summary>
    /// Replaces a track's metadata, creating it if absent. Every field is optional, and omitted
    /// fields are cleared rather than left unchanged.
    /// </summary>
    [HttpPut("{id:guid}/metadata")]
    [Authorize(Roles = nameof(Role.Distributor))]
    [ProducesResponseType<TrackMetadataDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TrackMetadataDto>> UpsertMetadata(
        Guid id,
        UpsertTrackMetadataRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(
            new UpsertTrackMetadataCommand(
                id,
                request.DurationSeconds,
                request.Bpm,
                request.Iswc,
                request.Language,
                request.IsExplicit,
                request.Label,
                request.CoverArtUrl,
                request.CopyrightLine),
            cancellationToken));

    /// <summary>
    /// Submits a track to one or more DSPs and marks it distributed. DSPs it already sits with are
    /// reported back as skipped rather than treated as an error.
    /// </summary>
    [HttpPost("{id:guid}/distribute")]
    [Authorize(Roles = nameof(Role.Distributor))]
    [ProducesResponseType<DistributeTrackResult>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DistributeTrackResult>> Distribute(
        Guid id,
        DistributeTrackRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new DistributeTrackCommand(id, request.DspIds), cancellationToken));

    /// <summary>Sets a track's own status. Available as a manual override at any time.</summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = nameof(Role.Distributor))]
    [ProducesResponseType<TrackStatusChangeResult>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TrackStatusChangeResult>> UpdateStatus(
        Guid id,
        UpdateTrackStatusRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(
            new UpdateTrackStatusCommand(id, request.Status, request.Reason),
            cancellationToken));

    /// <summary>Sets the status of one DSP distribution, optionally recording why.</summary>
    [HttpPatch("{id:guid}/distributions/{distributionId:guid}/status")]
    [Authorize(Roles = nameof(Role.Distributor))]
    [ProducesResponseType<DistributionStatusChangeResult>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DistributionStatusChangeResult>> UpdateDistributionStatus(
        Guid id,
        Guid distributionId,
        UpdateDistributionStatusRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(
            new UpdateDistributionStatusCommand(id, distributionId, request.Status, request.Reason),
            cancellationToken));
}
