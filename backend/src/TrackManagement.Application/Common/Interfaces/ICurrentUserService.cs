namespace TrackManagement.Application.Common.Interfaces;

public interface ICurrentUserService
{
    /// <summary>Null when there is no authenticated user — seeding, or system-initiated writes.</summary>
    Guid? UserId { get; }
}
