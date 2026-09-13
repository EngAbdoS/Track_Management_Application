using System.Text.Json;
using System.Text.Json.Serialization;

namespace TrackManagement.Api.Serialization;

/// <summary>
/// Replaces JsonStringEnumConverter so a bad value reports what was sent and what is allowed.
/// The built-in one throws a message naming the CLR type of the whole request object, which tells
/// the caller nothing and exposes internal namespaces.
/// </summary>
public class StrictEnumConverterFactory : JsonConverterFactory
{
    public override bool CanConvert(Type typeToConvert) => typeToConvert.IsEnum;

    public override JsonConverter CreateConverter(Type typeToConvert, JsonSerializerOptions options) =>
        (JsonConverter)Activator.CreateInstance(
            typeof(StrictEnumConverter<>).MakeGenericType(typeToConvert))!;
}

public class StrictEnumConverter<TEnum> : JsonConverter<TEnum>
    where TEnum : struct, Enum
{
    private static readonly string Allowed = string.Join(", ", Enum.GetNames<TEnum>());

    public override TEnum Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
        {
            throw new JsonException($"Value must be one of: {Allowed}.");
        }

        var value = reader.GetString();

        // Enum.TryParse accepts numeric strings and any comma-separated combination, so IsDefined
        // is what actually rejects "7" or "Live,Blocked".
        if (Enum.TryParse<TEnum>(value, ignoreCase: true, out var parsed) && Enum.IsDefined(parsed))
        {
            return parsed;
        }

        throw new JsonException($"'{value}' is not valid. Allowed values: {Allowed}.");
    }

    public override void Write(Utf8JsonWriter writer, TEnum value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
