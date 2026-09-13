import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastStore } from '../notifications/toast.store';
import { describeApiError, parseApiError } from './api-error';

/**
 * Surfaces only the failures no caller can do anything about — a 5xx or an
 * unreachable API. Validation, 404 and 409 belong against a field or in the page
 * that asked for them, and 401/403 are the auth interceptor's business, so those
 * pass through untouched rather than firing a toast nobody asked for.
 *
 * The original HttpErrorResponse is rethrown, never a parsed ApiError: the auth
 * interceptor sits in the same chain and needs the raw status to decide whether
 * to refresh. Callers parse at the point they handle it.
 */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const toasts = inject(ToastStore);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const parsed = parseApiError(error);

      if (parsed.kind === 'server' || parsed.kind === 'offline') {
        toasts.error(describeApiError(parsed));
      }

      return throwError(() => error);
    }),
  );
};
