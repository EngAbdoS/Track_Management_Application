namespace TrackManagement.Domain.Enums;

public enum DistributionStatus
{
    Pending,
    Live,
    Rejected,

    // Paused and Blocked are only meaningful after Live: Paused is our own decision to pull
    // the track, Blocked is the DSP taking it down (copyright claim, reports).
    Paused,
    Blocked
}
