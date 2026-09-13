import { Injectable } from '@angular/core';

const REFRESH_TOKEN_KEY = 'tm.refreshToken';

/**
 * Only the refresh token is persisted. The access token is held in memory by
 * AuthStore and never written anywhere, so a successful XSS cannot lift a live
 * bearer token out of storage — it would have to wait for, and win, a refresh.
 *
 * The refresh token has to survive a reload, and the API returns it in a response
 * body rather than an httpOnly cookie, so localStorage is the only option open to
 * us without putting a BFF in front of the API. The trade-off is written up in
 * DECISIONS.md rather than left implied.
 *
 * Storage is also the single source of truth for the refresh token: a refresh
 * always re-reads it here rather than trusting an in-memory copy, because another
 * tab may have rotated it in the meantime and the old value is revoked on use.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  readRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  writeRefreshToken(token: string): void {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch {
      // Private browsing: the session still works, it just will not survive a reload.
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // As above.
    }
  }
}
