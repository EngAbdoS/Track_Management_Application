using System.Collections.Frozen;

namespace TrackManagement.Domain.Common;

/// <summary>
/// Valid ISRC prefixes: ISO 3166-1 alpha-2 codes plus the registrant allocations that are not
/// countries at all. Kept separate from <see cref="IsoCountryCodes"/>, which must stay a pure
/// country list for artist validation.
/// </summary>
public static class IsrcPrefixCodes
{
    // QM and QZ are issued to US registrants that overflowed the US block and are extremely common
    // on independent releases; QT and QN are later additions to the same block; ZZ belongs to the
    // international agency. Validating against country codes alone would reject all of them.
    // Verify against the current IFPI ISRC Handbook before treating this list as complete.
    private static readonly FrozenSet<string> RegistrantAllocations =
        new[] { "QM", "QN", "QT", "QZ", "ZZ" }.ToFrozenSet(StringComparer.OrdinalIgnoreCase);

    public static bool IsValid(string? code) =>
        IsoCountryCodes.IsValid(code) || (code is not null && RegistrantAllocations.Contains(code));
}
