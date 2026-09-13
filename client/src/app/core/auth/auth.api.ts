import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthResponse, LoginRequest, RefreshRequest, UserResponse } from '../../models/api.models';
import { API_BASE_URL } from '../http/api-base-url';

/** Paths the auth interceptor must leave alone: they are anonymous and must never be retried. */
export const ANONYMOUS_AUTH_PATHS = ['/api/auth/login', '/api/auth/refresh'] as const;

/** Authenticated, but a 401 here means the session is already gone — retrying achieves nothing. */
export const LOGOUT_PATH = '/api/auth/logout';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  login(credentials: LoginRequest): Promise<AuthResponse> {
    return firstValueFrom(
      this.http.post<AuthResponse>(`${this.baseUrl}/api/auth/login`, credentials),
    );
  }

  refresh(refreshToken: string): Promise<AuthResponse> {
    const body: RefreshRequest = { refreshToken };
    return firstValueFrom(this.http.post<AuthResponse>(`${this.baseUrl}/api/auth/refresh`, body));
  }

  logout(refreshToken: string): Promise<void> {
    const body: RefreshRequest = { refreshToken };
    return firstValueFrom(this.http.post<void>(`${this.baseUrl}${LOGOUT_PATH}`, body));
  }

  /** Role comes from the database here, not from the token, so a role change takes effect at once. */
  me(): Promise<UserResponse> {
    return firstValueFrom(this.http.get<UserResponse>(`${this.baseUrl}/api/auth/me`));
  }
}
