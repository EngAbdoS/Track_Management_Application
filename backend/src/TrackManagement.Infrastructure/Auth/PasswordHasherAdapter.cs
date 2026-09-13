using Microsoft.AspNetCore.Identity;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Domain.Entities.Auth;

namespace TrackManagement.Infrastructure.Auth;

/// <summary>
/// Wraps Identity's PasswordHasher (PBKDF2) without pulling in the rest of the Identity stack.
/// </summary>
public class PasswordHasherAdapter : IPasswordHasher
{
    private readonly PasswordHasher<User> _hasher = new();

    public string Hash(string password) => _hasher.HashPassword(null!, password);

    public bool Verify(string hash, string password) =>
        _hasher.VerifyHashedPassword(null!, hash, password) != PasswordVerificationResult.Failed;
}
