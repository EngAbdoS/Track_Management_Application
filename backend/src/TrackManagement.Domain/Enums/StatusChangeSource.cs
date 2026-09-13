namespace TrackManagement.Domain.Enums;

/// <summary>Why a status row was written, not who wrote it — every change is an authenticated call.</summary>
public enum StatusChangeSource
{
    Created,
    DistributeAction,
    ManualUpdate
}
