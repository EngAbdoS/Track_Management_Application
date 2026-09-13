using TrackManagement.Application.Common.Auth;
using TrackManagement.Application.Common.Interfaces;

namespace TrackManagement.Api.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public Guid? UserId
    {
        get
        {
            var claim = httpContextAccessor.HttpContext?.User.FindFirst(AuthClaimTypes.UserId)?.Value;
            return Guid.TryParse(claim, out var id) ? id : null;
        }
    }
}
