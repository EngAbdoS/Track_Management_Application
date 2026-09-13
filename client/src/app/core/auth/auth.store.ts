import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthResponse, LoginRequest, UserResponse } from '../../models/api.models';
import { AuthApi } from './auth.api';
import { TokenStorage } from './token-storage';

export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

/** Refresh this long before the access token actually expires. */
const REFRESH_LEAD_MS = 60_000;
const REFRESH_LOCK = 'tm.auth.refresh';
const CHANNEL_NAME = 'tm.auth';

type AuthBroadcast =
  | { type: 'tokens'; accessToken: string; expiresAt: string }
  | { type: 'signed-out' };

/**
 * Owns the session. The contract is blunt about the hazard here: a refresh token is
 * revoked the instant it is used, and presenting a spent one makes the server revoke
 * *every* session for that user. Four things guard against that:
 *
 *  1. Single-flight — one shared promise, so simultaneous 401s await one refresh.
 *  2. A cross-tab lock — Web Locks serialises refreshes across tabs, and the token is
 *     re-read from storage inside the lock so a waiter never spends a stale value.
 *  3. Proactive refresh — renew a minute before expiry, so the 401 race rarely starts.
 *  4. Broadcast — a tab that refreshes hands the new access token to its siblings,
 *     so they need not refresh at all.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AuthApi);
  private readonly storage = inject(TokenStorage);

  private readonly _accessToken = signal<string | null>(null);
  private readonly _user = signal<UserResponse | null>(null);
  private readonly _status = signal<AuthStatus>('unknown');

  /** Memory only — deliberately never persisted. See TokenStorage. */
  readonly accessToken = this._accessToken.asReadonly();
  readonly user = this._user.asReadonly();
  readonly status = this._status.asReadonly();

  readonly isAuthenticated = computed(() => this._status() === 'authenticated');
  readonly role = computed(() => this._user()?.role ?? null);
  /** Gates every write control in the UI, so a Viewer never sees a button that would 403. */
  readonly canWrite = computed(() => this.role() === 'Distributor');

  private refreshInFlight: Promise<string> | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly channel = openChannel();

  constructor() {
    this.channel?.addEventListener('message', (event: MessageEvent<AuthBroadcast>) =>
      this.adoptFromOtherTab(event.data),
    );
  }

  /** Runs before the first route renders. One extra round trip per reload, by design. */
  async restoreSession(): Promise<void> {
    if (!this.storage.readRefreshToken()) {
      this._status.set('anonymous');
      return;
    }

    try {
      await this.refreshAccessToken();
      await this.loadUser();
    } catch {
      this.clearSession();
    }
  }

  async login(credentials: LoginRequest): Promise<void> {
    this.acceptTokens(await this.api.login(credentials));
    await this.loadUser();
  }

  async logout(): Promise<void> {
    const refreshToken = this.storage.readRefreshToken();

    try {
      if (refreshToken) {
        await this.api.logout(refreshToken);
      }
    } catch {
      // Logout never reports whether a token was real, and a failure here must not
      // strand the user in a half-signed-in state.
    } finally {
      this.clearSession();
    }
  }

  refreshAccessToken(): Promise<string> {
    this.refreshInFlight ??= this.runRefresh().finally(() => {
      this.refreshInFlight = null;
    });

    return this.refreshInFlight;
  }

  /** Called when a refresh fails: the session is unrecoverable, so drop it locally. */
  clearSession(broadcast = true): void {
    this.storage.clear();
    this._accessToken.set(null);
    this._user.set(null);
    this._status.set('anonymous');
    this.cancelScheduledRefresh();

    if (broadcast) {
      this.channel?.postMessage({ type: 'signed-out' } satisfies AuthBroadcast);
    }
  }

  private runRefresh(): Promise<string> {
    return withCrossTabLock(REFRESH_LOCK, async () => {
      // Read inside the lock, never before it: a tab that waited here may have been
      // holding a value that the tab ahead of it has since spent and had revoked.
      const refreshToken = this.storage.readRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const tokens = await this.api.refresh(refreshToken);
      this.acceptTokens(tokens);

      return tokens.accessToken;
    });
  }

  private async loadUser(): Promise<void> {
    this._user.set(await this.api.me());
    this._status.set('authenticated');
  }

  private acceptTokens(tokens: AuthResponse): void {
    this.storage.writeRefreshToken(tokens.refreshToken);
    this._accessToken.set(tokens.accessToken);
    this.scheduleProactiveRefresh(tokens.accessTokenExpiresAt);

    this.channel?.postMessage({
      type: 'tokens',
      accessToken: tokens.accessToken,
      expiresAt: tokens.accessTokenExpiresAt,
    } satisfies AuthBroadcast);
  }

  private adoptFromOtherTab(message: AuthBroadcast): void {
    if (message.type === 'signed-out') {
      this.clearSession(false);
      return;
    }

    this._accessToken.set(message.accessToken);
    this.scheduleProactiveRefresh(message.expiresAt);

    // Another tab signed in while this one was sitting on the login screen.
    if (this._status() !== 'authenticated') {
      void this.loadUser().catch(() => this.clearSession(false));
    }
  }

  private scheduleProactiveRefresh(expiresAt: string): void {
    this.cancelScheduledRefresh();

    const msUntilRefresh = Date.parse(expiresAt) - Date.now() - REFRESH_LEAD_MS;

    if (Number.isNaN(msUntilRefresh)) {
      return;
    }

    this.refreshTimer = setTimeout(
      () => void this.refreshAccessToken().catch(() => this.clearSession()),
      Math.max(msUntilRefresh, 1_000),
    );
  }

  private cancelScheduledRefresh(): void {
    if (this.refreshTimer !== null) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

/**
 * Web Locks serialise the refresh across every tab of the origin. Without it, two tabs
 * reloading at the same moment each exchange the same stored refresh token, the second
 * presents a revoked one, and the server treats that as a leak and signs the user out
 * everywhere. Degrades to a plain call where the API is unavailable (jsdom, older
 * browsers), which still leaves the in-tab single-flight promise doing its job.
 */
async function withCrossTabLock<T>(name: string, work: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;

  if (!locks) {
    return work();
  }

  // The result is captured rather than returned through request(): lib.dom types the
  // granted callback as returning T rather than T | PromiseLike<T>, so returning a
  // promise from it infers Promise<Promise<T>>.
  let result!: T;
  await locks.request(name, async () => {
    result = await work();
  });

  return result;
}

function openChannel(): BroadcastChannel | null {
  return typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL_NAME);
}
