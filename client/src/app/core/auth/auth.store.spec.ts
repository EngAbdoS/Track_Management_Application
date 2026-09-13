import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AuthResponse } from '../../models/api.models';
import { AuthApi } from './auth.api';
import { AuthStore } from './auth.store';

const REFRESH_TOKEN_KEY = 'tm.refreshToken';

function tokensFor(generation: number): AuthResponse {
  return {
    accessToken: `access-${generation}`,
    refreshToken: `refresh-${generation}`,
    accessTokenExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
  };
}

describe('AuthStore', () => {
  let refreshCalls: string[];
  let api: Pick<AuthApi, 'refresh' | 'me' | 'login' | 'logout'>;

  beforeEach(() => {
    localStorage.clear();
    refreshCalls = [];

    api = {
      refresh: vi.fn(async (token: string) => {
        refreshCalls.push(token);
        // A real refresh is not instantaneous; the delay is what lets concurrent
        // callers pile up, which is the case being tested.
        await new Promise((resolve) => setTimeout(resolve, 5));
        return tokensFor(refreshCalls.length);
      }),
      me: vi.fn(async () => ({ id: 'u1', username: 'distributor', role: 'Distributor' as const })),
      login: vi.fn(),
      logout: vi.fn(),
    };

    TestBed.configureTestingModule({ providers: [{ provide: AuthApi, useValue: api }] });
  });

  it('collapses concurrent refreshes into a single request', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-0');
    const store = TestBed.inject(AuthStore);

    const results = await Promise.all([
      store.refreshAccessToken(),
      store.refreshAccessToken(),
      store.refreshAccessToken(),
    ]);

    // The whole point: three 401s must not spend three refresh tokens, because the
    // second and third would present a revoked one and log the user out everywhere.
    expect(refreshCalls).toEqual(['refresh-0']);
    expect(results).toEqual(['access-1', 'access-1', 'access-1']);
  });

  it('starts a new request once the in-flight one has settled', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-0');
    const store = TestBed.inject(AuthStore);

    await store.refreshAccessToken();
    await store.refreshAccessToken();

    expect(refreshCalls).toHaveLength(2);
  });

  it('always spends the stored refresh token, never a remembered one', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-0');
    const store = TestBed.inject(AuthStore);

    await store.refreshAccessToken();
    // Stands in for another tab rotating the token while this one was idle.
    localStorage.setItem(REFRESH_TOKEN_KEY, 'rotated-elsewhere');
    await store.refreshAccessToken();

    expect(refreshCalls).toEqual(['refresh-0', 'rotated-elsewhere']);
  });

  it('rotates the stored refresh token and keeps the access token out of storage', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-0');
    const store = TestBed.inject(AuthStore);

    await store.refreshAccessToken();

    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('refresh-1');
    expect(store.accessToken()).toBe('access-1');
    expect(JSON.stringify(localStorage)).not.toContain('access-1');
  });

  it('reports anonymous when there is nothing stored to restore', async () => {
    const store = TestBed.inject(AuthStore);

    await store.restoreSession();

    expect(refreshCalls).toEqual([]);
    expect(store.status()).toBe('anonymous');
    expect(store.isAuthenticated()).toBe(false);
  });

  it('restores a session from a stored refresh token', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-0');
    const store = TestBed.inject(AuthStore);

    await store.restoreSession();

    expect(store.isAuthenticated()).toBe(true);
    expect(store.user()?.username).toBe('distributor');
    expect(store.canWrite()).toBe(true);
  });

  it('drops the session when the stored token is rejected', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'revoked');
    api.refresh = vi.fn(async () => {
      throw new Error('401');
    });
    const store = TestBed.inject(AuthStore);

    await store.restoreSession();

    expect(store.status()).toBe('anonymous');
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });

  it('denies write access to a Viewer', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-0');
    api.me = vi.fn(async () => ({ id: 'u2', username: 'viewer', role: 'Viewer' as const }));
    const store = TestBed.inject(AuthStore);

    await store.restoreSession();

    expect(store.isAuthenticated()).toBe(true);
    expect(store.canWrite()).toBe(false);
  });
});
