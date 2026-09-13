import { HttpErrorResponse } from '@angular/common/http';
import { describeApiError, parseApiError, toControlName } from './api-error';

// Every body below was captured from the running API, not written from the contract.
function response(status: number, error: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error, url: 'http://localhost:5229/api/tracks' });
}

describe('parseApiError', () => {
  it('reads a field-keyed 400 with the API PascalCase keys intact', () => {
    const error = parseApiError(
      response(400, {
        title: 'Validation failed',
        status: 400,
        errors: {
          Title: ["'Title' must not be empty."],
          Isrc: ['ISRC must be 12 characters in the form CC-XXX-YY-NNNNN.'],
        },
      }),
    );

    expect(error).toEqual({
      kind: 'validation',
      title: 'Validation failed',
      fields: {
        Title: ["'Title' must not be empty."],
        Isrc: ['ISRC must be 12 characters in the form CC-XXX-YY-NNNNN.'],
      },
    });
  });

  it('keeps enum messages verbatim, because they list the permitted values', () => {
    const error = parseApiError(
      response(400, {
        title: 'Validation failed',
        errors: { Status: ["'pendinggg' is not valid. Allowed values: Draft, Submitted, Distributed."] },
      }),
    );

    expect(error.kind).toBe('validation');
    expect(describeApiError(error)).toContain('Allowed values: Draft, Submitted, Distributed.');
  });

  it('replaces the message that leaks the internal command type', () => {
    const error = parseApiError(
      response(400, {
        title: 'Validation failed',
        errors: {
          Title: [
            'The JSON value could not be converted to TrackManagement.Application.Tracks.Commands.CreateTrack.CreateTrackCommand.',
          ],
        },
      }),
    );

    expect(error.kind).toBe('validation');
    if (error.kind === 'validation') {
      expect(error.fields['Title']).toEqual(['That value is not in the expected format.']);
    }
  });

  it('carries the detail of a failed login, which answers 401 *with* a body', () => {
    const error = parseApiError(
      response(401, { title: 'Unauthorized', status: 401, detail: 'Invalid credentials.' }),
    );

    expect(error).toEqual({ kind: 'unauthenticated', detail: 'Invalid credentials.' });
  });

  it('handles the empty-bodied 401 of a missing or expired token', () => {
    expect(parseApiError(response(401, null))).toEqual({ kind: 'unauthenticated', detail: null });
  });

  it('does not try to read the empty 403 body', () => {
    expect(parseApiError(response(403, null))).toEqual({ kind: 'forbidden' });
  });

  it('reads 404 and 409 as a single message', () => {
    expect(
      parseApiError(
        response(404, {
          title: 'Not found',
          status: 404,
          detail: "Track '00000000-0000-0000-0000-000000000001' was not found.",
        }),
      ),
    ).toEqual({
      kind: 'message',
      status: 404,
      title: 'Not found',
      detail: "Track '00000000-0000-0000-0000-000000000001' was not found.",
    });

    expect(
      parseApiError(
        response(409, {
          title: 'Conflict',
          status: 409,
          detail: "An artist with email 'amr.diab@example.com' already exists.",
        }),
      ),
    ).toMatchObject({ kind: 'message', status: 409 });
  });

  it('never surfaces a 500 body', () => {
    expect(parseApiError(response(500, { title: 'Server error', detail: 'anything' }))).toEqual({
      kind: 'server',
    });
  });

  it('treats status 0 as unreachable rather than as a server fault', () => {
    expect(parseApiError(response(0, new ProgressEvent('error')))).toEqual({ kind: 'offline' });
  });

  it('falls back to a message when a 400 arrives without a field map', () => {
    expect(parseApiError(response(400, { title: 'Bad request', detail: 'Malformed.' }))).toMatchObject({
      kind: 'message',
      status: 400,
    });
  });

  it('survives an HTML error page instead of JSON', () => {
    expect(parseApiError(response(404, '<html>Not found</html>'))).toMatchObject({
      kind: 'message',
      title: 'Request failed',
    });
  });

  it('treats anything that is not an HttpErrorResponse as a server fault', () => {
    expect(parseApiError(new Error('boom'))).toEqual({ kind: 'server' });
  });
});

describe('toControlName', () => {
  it('maps API field keys onto form control names', () => {
    expect(toControlName('Isrc')).toBe('isrc');
    expect(toControlName('ArtistId')).toBe('artistId');
    expect(toControlName('DspIds')).toBe('dspIds');
    // Model-binding failures key on a lowercase "body"; it must survive untouched.
    expect(toControlName('body')).toBe('body');
  });
});
