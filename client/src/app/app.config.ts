import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { AuthStore } from './core/auth/auth.store';
import { errorInterceptor } from './core/http/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Route params arrive as component inputs, so a detail page can take
      // `id` as a signal input instead of subscribing to ActivatedRoute.
      withComponentInputBinding(),
      // withViewTransitions() is deliberately absent. It makes every navigation wait on
      // document.startViewTransition(), which never gets a frame when the page is not
      // being painted — and in that state updateCallbackDone never settles, so router
      // navigations hang indefinitely (this is what silently broke the post-logout
      // redirect). A cosmetic crossfade is not worth making navigation depend on the
      // compositor. See phase-c3 for the reproduction.
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    // Order matters: auth attaches the bearer and owns 401 retries, so it must sit
    // outside the error interceptor, which only observes and rethrows.
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
    // Exchanges a stored refresh token for a session before the first route renders,
    // so guards never see a half-restored state and no login screen flashes first.
    provideAppInitializer(() => inject(AuthStore).restoreSession()),
  ],
};
