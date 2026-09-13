namespace TrackManagement.Application.Common.Text;

public interface IArabicAwareNormalizer
{
    /// <summary>Folds a display name into the key used for duplicate detection.</summary>
    string Normalize(string value);
}
