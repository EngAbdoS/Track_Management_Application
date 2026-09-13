import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Route params arrive as component inputs, so a detail page can take
      // `id` as a signal input instead of subscribing to ActivatedRoute.
      withComponentInputBinding(),
      // The first navigation happens while the document is still settling, and the
      // browser aborts that transition ("Transition was aborted because of invalid
      // state"), leaving a stuck overlay over a blank page. There is nothing to
      // animate from on a cold load anyway.
      withViewTransitions({ skipInitialTransition: true }),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
  ],
};
