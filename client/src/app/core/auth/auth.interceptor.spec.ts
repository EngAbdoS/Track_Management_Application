import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Mock, vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthStore } from './auth.store';

const API = 'http://localhost:5229';

/** Lets the `from(promise)` inside the interceptor settle before asserting. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let refresh: Mock<() => Promise<string>>;
  let clearSession: Mock<() => void>;
  let navigate: Mock<(commands: unknown[], extras?: unknown) => void>;

  beforeEach(() => {
    refresh = vi.fn(async () => 'fresh-token');
    clearSession = vi.fn();
    navigate = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthStore,
          useValue: {
            accessToken: signal<string | null>('stale-token'),
            refreshAccessToken: () => refresh(),
            clearSession,
          },
        },
        { provide: Router, useValue: { navigate, url: '/tracks' } },
      ],
    });

    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('attaches the bearer token', () => {
    http.get(`${API}/api/tracks`).subscribe();

    const request = backend.expectOne(`${API}/api/tracks`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer stale-token');
    request.flush([]);
  });

  it('refreshes once on a 401 and retries the original request', async () => {
    const observed: unknown[] = [];
    http.get(`${API}/api/tracks`).subscribe((value) => observed.push(value));

    backend
      .expectOne(`${API}/api/tracks`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await settle();

    const retry = backend.expectOne(`${API}/api/tracks`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer fresh-token');
    retry.flush([{ id: 't1' }]);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(observed).toEqual([[{ id: 't1' }]]);
  });

  it('signs out and redirects when the refresh itself fails', async () => {
    refresh = vi.fn(async () => {
      throw new Error('refresh rejected');
    });
    let failed = false;

    http.get(`${API}/api/tracks`).subscribe({ error: () => (failed = true) });
    backend
      .expectOne(`${API}/api/tracks`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await settle();

    expect(clearSession).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/tracks' } });
    expect(failed).toBe(true);
  });

  it('never refreshes on a 403 — wrong role is not an expired token', async () => {
    let failed = false;
    http.post(`${API}/api/tracks`, {}).subscribe({ error: () => (failed = true) });

    backend.expectOne(`${API}/api/tracks`).flush(null, { status: 403, statusText: 'Forbidden' });
    await settle();

    expect(refresh).not.toHaveBeenCalled();
    expect(failed).toBe(true);
  });

  it('leaves login and refresh unauthenticated and un-retried', async () => {
    let failed = false;
    http.post(`${API}/api/auth/login`, {}).subscribe({ error: () => (failed = true) });

    const request = backend.expectOne(`${API}/api/auth/login`);
    expect(request.request.headers.has('Authorization')).toBe(false);

    // A failed login answers 401. Retrying it would be pointless; refreshing, harmful.
    request.flush({ detail: 'Invalid credentials.' }, { status: 401, statusText: 'Unauthorized' });
    await settle();

    expect(refresh).not.toHaveBeenCalled();
    expect(failed).toBe(true);
  });

  it('does not retry logout', async () => {
    let failed = false;
    http.post(`${API}/api/auth/logout`, {}).subscribe({ error: () => (failed = true) });

    const request = backend.expectOne(`${API}/api/auth/logout`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer stale-token');
    request.flush(null, { status: 401, statusText: 'Unauthorized' });
    await settle();

    expect(refresh).not.toHaveBeenCalled();
    expect(failed).toBe(true);
  });
});
