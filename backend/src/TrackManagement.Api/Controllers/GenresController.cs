using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrackManagement.Application.Common.Pagination;
using TrackManagement.Application.Genres.Commands.CreateGenre;
using TrackManagement.Application.Genres.Dtos;
using TrackManagement.Application.Genres.Queries.GetGenres;
using TrackManagement.Domain.Enums;

namespace TrackManagement.Api.Controllers;

[ApiController]
[Route("api/genres")]
public class GenresController(ISender sender) : ControllerBase
{
    /// <summary>Lists genres alphabetically, for populating a picker.</summary>
    [HttpGet]
    [ProducesResponseType<PagedResult<GenreDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<GenreDto>>> GetAll(
        [FromQuery] GetGenresQuery query,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(query, cancellationToken));

    /// <summary>
    /// Adds a genre. If the name normalizes to one that already exists — including Arabic spelling
    /// variants — the existing genre is returned with 200 instead of a duplicate being created.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = nameof(Role.Distributor))]
    [ProducesResponseType<GenreDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<GenreDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<GenreDto>> Create(
        CreateGenreCommand command,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);

        return result.AlreadyExisted
            ? Ok(result.Genre)
            : CreatedAtAction(nameof(Create), new { id = result.Genre.Id }, result.Genre);
    }
}
