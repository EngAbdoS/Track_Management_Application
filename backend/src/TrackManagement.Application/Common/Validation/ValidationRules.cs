using FluentValidation;
using TrackManagement.Domain.Common;

namespace TrackManagement.Application.Common.Validation;

public static class ValidationRules
{
    public static IRuleBuilderOptions<T, string> MustBeIsoCountryCode<T>(
        this IRuleBuilder<T, string> rule) =>
        rule.Must(IsoCountryCodes.IsValid)
            .WithMessage("'{PropertyName}' must be a valid ISO 3166-1 alpha-2 country code.");

    /// <summary>Passes when the value is absent — pair with a null check only where required.</summary>
    public static IRuleBuilderOptions<T, string?> MustBeAbsoluteHttpUrl<T>(
        this IRuleBuilder<T, string?> rule) =>
        rule.Must(value => string.IsNullOrWhiteSpace(value)
                           || (Uri.TryCreate(value, UriKind.Absolute, out var uri)
                               && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)))
            .WithMessage("'{PropertyName}' must be an absolute http or https URL.");
}
