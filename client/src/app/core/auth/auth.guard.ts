import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastStore } from '../notifications/toast.store';
import { AuthStore } from './auth.store';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  return (
    auth.isAuthenticated() ||
    router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })
  );
};

/** Keeps an already signed-in user off the login screen. */
export const anonymousGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  return !auth.isAuthenticated() || router.createUrlTree(['/tracks']);
};

/**
 * Write routes. A Viewer should never reach one — every control leading here is hidden
 * from them — so arriving is either a typed URL or a bookmark, and saying so is kinder
 * than a bare redirect.
 */
export const distributorGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const toasts = inject(ToastStore);

  if (auth.canWrite()) {
    return true;
  }

  toasts.error('That page is only available to distributors.');

  return router.createUrlTree(['/tracks']);
};
