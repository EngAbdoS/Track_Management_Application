import { HttpErrorResponse } from '@angular/common/http';

/**
 * Every failure the API can produce, as one union. Shapes were captured from the
 * running service, not read off the contract — see phase-c2 for the transcript.
 */
export type ApiError =
  | { kind: 'validation'; title: string; fields: FieldErrors }
  | { kind: 'unauthenticated'; detail: string | null }
  | { kind: 'forbidden' }
  | { kind: 'message'; status: number; title: string; detail: string }
  | { kind: 'server' }
  | { kind: 'offline' };

/** Keys are the API's PascalCase property names, exactly as sent. */
export type FieldErrors = Record<string, string[]>;

interface ValidationBody {
  title?: string;
  errors?: Record<string, string[]>;
}

interface MessageBody {
  title?: string;
  detail?: string;
}

export function parseApiError(error: unknown): ApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return { kind: 'server' };
  }

  // Status 0 is the browser refusing to complete the request at all: API down,
  // DNS failure, or a CORS rejection. Indistinguishable from here, and all three
  // mean "we never reached the API".
  if (error.status === 0) {
    return { kind: 'offline' };
  }

  switch (error.status) {
    case 400:
      return parseValidation(error);

    // Two structurally different 401s. A failed login answers with a body
    // ({ title, status, detail: "Invalid credentials." }); a missing or expired
    // token answers with an empty body and a WWW-Authenticate header. Only the
    // second is worth refreshing a token over.
    case 401:
      return { kind: 'unauthenticated', detail: readBody<MessageBody>(error)?.detail?.trim() || null };

    case 403:
      return { kind: 'forbidden' };

    case 404:
    case 409:
      return parseMessage(error);

    default:
      return error.status >= 500 ? { kind: 'server' } : parseMessage(error);
  }
}

function parseValidation(error: HttpErrorResponse): ApiError {
  const body = readBody<ValidationBody>(error);
  const entries = Object.entries(body?.errors ?? {});

  if (entries.length === 0) {
    // A 400 with no field map is still a client error; treat it as a plain message
    // so nothing silently swallows it.
    return parseMessage(error);
  }

  const fields: FieldErrors = {};
  for (const [key, messages] of entries) {
    fields[key] = messages.map(sanitizeMessage);
  }

  return { kind: 'validation', title: body?.title?.trim() || 'Validation failed', fields };
}

function parseMessage(error: HttpErrorResponse): ApiError {
  const body = readBody<MessageBody>(error);

  return {
    kind: 'message',
    status: error.status,
    title: body?.title?.trim() || 'Request failed',
    detail: sanitizeMessage(body?.detail?.trim() || 'The request could not be completed.'),
  };
}

function readBody<T>(error: HttpErrorResponse): T | null {
  const body: unknown = error.error;

  if (body && typeof body === 'object') {
    return body as T;
  }

  // A non-JSON body (an HTML error page, say) is never useful to a user.
  return null;
}

/**
 * Most server messages are written for humans and are shown verbatim — the enum ones
 * even list the permitted values. The exception is System.Text.Json's converter
 * message, which names the internal command type ("could not be converted to
 * TrackManagement.Application.Tracks.Commands.CreateTrack.CreateTrackCommand"). That
 * is an implementation detail leaking to the browser, and it means nothing to a user.
 */
export function sanitizeMessage(message: string): string {
  const leaksInternals = /could not be converted to/i.test(message) || /TrackManagement\./.test(message);

  return leaksInternals ? 'That value is not in the expected format.' : message;
}

/** PascalCase API keys to camelCase control names: `Isrc` -> `isrc`, `ArtistId` -> `artistId`. */
export function toControlName(apiFieldName: string): string {
  return apiFieldName.length > 0
    ? apiFieldName[0].toLowerCase() + apiFieldName.slice(1)
    : apiFieldName;
}

/** One line fit for a toast or a form-level banner. */
export function describeApiError(error: ApiError): string {
  switch (error.kind) {
    case 'validation': {
      const first = Object.values(error.fields)[0]?.[0];
      return first ?? 'Some of the values are not valid.';
    }
    case 'unauthenticated':
      return error.detail ?? 'Your session has expired. Please sign in again.';
    case 'forbidden':
      return 'You do not have permission to do that.';
    case 'message':
      return error.detail;
    case 'server':
      return 'Something went wrong on the server. Please try again.';
    case 'offline':
      return 'Could not reach the API. Check that it is running.';
  }
}
