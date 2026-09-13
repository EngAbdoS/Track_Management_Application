namespace TrackManagement.Domain.Exceptions;

/// <summary>
/// Deliberately carries no detail about which part of the credentials failed — callers must not be
/// able to distinguish "no such user" from "wrong password".
/// </summary>
public class InvalidCredentialsException() : Exception("Invalid credentials.");
