using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrackManagement.Application.Auth.Commands.CreateUser;
using TrackManagement.Application.Auth.Dtos;
using TrackManagement.Domain.Enums;

namespace TrackManagement.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = nameof(Role.Distributor))]
public class UsersController(ISender sender) : ControllerBase
{
    /// <summary>Creates a user account. There is no self-registration.</summary>
    [HttpPost]
    [ProducesResponseType<UserResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UserResponse>> Create(
        CreateUserCommand command,
        CancellationToken cancellationToken)
    {
        var user = await sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(Create), new { id = user.Id }, user);
    }
}
