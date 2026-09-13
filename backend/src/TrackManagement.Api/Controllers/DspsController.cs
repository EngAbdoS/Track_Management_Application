using MediatR;
using Microsoft.AspNetCore.Mvc;
using TrackManagement.Application.Dsps.Queries.GetDsps;

namespace TrackManagement.Api.Controllers;

[ApiController]
[Route("api/dsps")]
public class DspsController(ISender sender) : ControllerBase
{
    /// <summary>Lists the DSPs a track can be distributed to. Seeded; not editable through the API.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<DspDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<DspDto>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetDspsQuery(), cancellationToken));
}
