import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { ANONYMOUS_AUTH_PATHS, LOGOUT_PATH } from './auth.api';
import { AuthStore } from './auth.store';

/**
 * Attaches the bearer token, and on a 401 refreshes once and retries the original
 * request. Three rules, each of which exists to avoid burning a refresh token:
 *
 *  - Login and refresh carry no bearer and are never retried. Retrying a failed
 *    refresh is how a single expired session becomes "signed out of everything".
 *  - Logout gets a bearer but no retry — a 401 there means the session is already gone.
 *  - A 403 is a role failure, not an expiry. Refreshing would spend a good token to
 *    produce the same 403.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (isAnonymousPath(request.url)) {
    return next(request);
  }

  const token = auth.accessToken();
  const authorized = token ? withBearer(request, token) : request;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      const isExpired = error instanceof HttpErrorResponse && error.status === 401;

      if (!isExpired || request.url.includes(LOGOUT_PATH)) {
        return throwError(() => error);
      }

      return from(auth.refreshAccessToken()).pipe(
        switchMap((fresh) => next(withBearer(request, fresh))),
        catchError(() => {
          auth.clearSession();
          void router.navigate(['/login'], {
            queryParams: { returnUrl: router.url },
          });

          return throwError(() => error);
        }),
      );
    }),
  );
};

function withBearer<T>(request: HttpRequest<T>, token: string): HttpRequest<T> {
  return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function isAnonymousPath(url: string): boolean {
  return ANONYMOUS_AUTH_PATHS.some((path) => url.includes(path));
}
