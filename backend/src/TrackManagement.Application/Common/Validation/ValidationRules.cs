using FluentValidation;
using TrackManagement.Domain.Common;

namespace TrackManagement.Application.Common.Validation;

public static class ValidationRules
{
    public static IRuleBuilderOptions<T, string> MustBeIsoCountryCode<T>(
        this IRuleBuilder<T, string> rule) =>
        rule.Must(IsoCountryCodes.IsValid)
            .WithMessage("'{PropertyName}' must be a valid ISO 3166-1 alpha-2 country code.");
}
