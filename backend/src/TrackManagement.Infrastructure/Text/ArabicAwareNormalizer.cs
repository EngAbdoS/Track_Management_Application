using System.Globalization;
using System.Text;
using TrackManagement.Application.Common.Text;

namespace TrackManagement.Infrastructure.Text;

public class ArabicAwareNormalizer : IArabicAwareNormalizer
{
    private const char Tatweel = 'ـ';
    private const char AlefMaksura = 'ى';
    private const char Yeh = 'ي';

    public string Normalize(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var collapsed = CollapseWhitespace(value);

        // NFKD splits letters from their marks, which turns أ إ آ into alef and ؤ ئ into waw/yeh
        // once the marks are dropped below — no explicit table needed for those. It also folds
        // Arabic presentation forms, which show up in copy-pasted text.
        var decomposed = collapsed.Normalize(NormalizationForm.FormKD);

        var builder = new StringBuilder(decomposed.Length);

        foreach (var c in decomposed)
        {
            if (c == Tatweel || CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            // Alef maksura and yeh are separate letters rather than one decomposing to the other,
            // so this is the one fold that has to be spelled out. Teh marbuta is deliberately
            // left alone: folding ة into ه would merge genuinely different words.
            builder.Append(c == AlefMaksura ? Yeh : c);
        }

        return builder.ToString()
            .ToLowerInvariant()
            .Normalize(NormalizationForm.FormC);
    }

    private static string CollapseWhitespace(string value)
    {
        var builder = new StringBuilder(value.Length);
        var lastWasWhitespace = false;

        foreach (var c in value.Trim())
        {
            if (char.IsWhiteSpace(c))
            {
                lastWasWhitespace = true;
                continue;
            }

            if (lastWasWhitespace && builder.Length > 0)
            {
                builder.Append(' ');
            }

            lastWasWhitespace = false;
            builder.Append(c);
        }

        return builder.ToString();
    }
}
