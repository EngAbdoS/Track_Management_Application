import { Routes } from '@angular/router';

// Guards land in phase C3, once there is an AuthStore to gate on. Every page is
// lazy so a route only costs what it renders.
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tracks' },
  {
    path: 'login',
    title: 'Sign in',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'tracks',
    title: 'Tracks',
    loadComponent: () =>
      import('./features/tracks/pages/track-list/track-list').then((m) => m.TrackList),
  },
  {
    path: 'tracks/:id',
    title: 'Track',
    loadComponent: () =>
      import('./features/tracks/pages/track-detail/track-detail').then((m) => m.TrackDetail),
  },
  {
    path: 'artists',
    title: 'Artists',
    loadComponent: () =>
      import('./features/artists/pages/artist-list/artist-list').then((m) => m.ArtistList),
  },
  {
    path: 'genres',
    title: 'Genres',
    loadComponent: () =>
      import('./features/genres/pages/genre-list/genre-list').then((m) => m.GenreList),
  },
  {
    path: '**',
    title: 'Not found',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
