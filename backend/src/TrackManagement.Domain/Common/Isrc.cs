using System.Text.RegularExpressions;

namespace TrackManagement.Domain.Common;

/// <summary>
/// Parsing and validation for ISRCs (CC-XXX-YY-NNNNN): two-letter prefix, three-character
/// registrant, two-digit year of reference, five-digit designation.
/// </summary>
public static partial class Isrc
{
    [GeneratedRegex(@"^[A-Z]{2}[A-Z0-9]{3}\d{7}$")]
    private static partial Regex Shape();

    [GeneratedRegex(@"[\s\-]")]
    private static partial Regex Separators();

    public static bool TryNormalize(string? raw, out string normalized, out string error)
    {
        normalized = string.Empty;
        error = string.Empty;

        if (string.IsNullOrWhiteSpace(raw))
        {
            error = "ISRC is required.";
            return false;
        }

        var candidate = Separators().Replace(raw, string.Empty).ToUpperInvariant();

        // Covers the year field too: positions 5-6 must be digits. A *range* check on those two
        // digits is deliberately not applied — see the note below.
        if (!Shape().IsMatch(candidate))
        {
            error = "ISRC must be 12 characters in the form CC-XXX-YY-NNNNN.";
            return false;
        }

        var prefix = candidate[..2];

        if (!IsrcPrefixCodes.IsValid(prefix))
        {
            error = $"'{prefix}' is not a valid ISRC country or registrant prefix.";
            return false;
        }

        normalized = candidate;
        return true;
    }
}

// Why the year of reference is not range-checked
// ----------------------------------------------
// Two digits carry no century, and both readings are legitimate: 76 is 1976 or 2076. Anchoring
// them against "now" makes a future year unrepresentable — anything above the current two digits
// simply reads as 19xx — so a range check can only ever reject *old* years, never impossible ones.
//
// Rejecting old years is wrong. The year of reference records when the code was allocated, and
// back-catalogue registrations legitimately carry pre-1986 values; the standard's own example,
// USRC17607839, resolves to 1976. An earlier version of this validator enforced a 1986 floor and
// rejected exactly that ISRC.
//
// So the shape check is the honest limit of what two digits support. Adding a floor would trade a
// real false-rejection risk for no real detection.
