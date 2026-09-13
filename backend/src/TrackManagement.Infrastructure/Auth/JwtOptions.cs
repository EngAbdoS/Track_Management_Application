namespace TrackManagement.Infrastructure.Auth;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    /// <summary>HMAC-SHA256 needs at least 256 bits of key material; shorter keys are rejected at startup.</summary>
    public const int MinimumKeyLengthBytes = 32;

    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string SigningKey { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 7;

    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(Issuer) || string.IsNullOrWhiteSpace(Audience))
        {
            throw new InvalidOperationException("Jwt:Issuer and Jwt:Audience must be configured.");
        }

        if (System.Text.Encoding.UTF8.GetByteCount(SigningKey) < MinimumKeyLengthBytes)
        {
            throw new InvalidOperationException(
                $"Jwt:SigningKey must be at least {MinimumKeyLengthBytes} bytes. " +
                "Set it with `dotnet user-secrets set \"Jwt:SigningKey\" \"<value>\"` or the Jwt__SigningKey environment variable.");
        }
    }
}
