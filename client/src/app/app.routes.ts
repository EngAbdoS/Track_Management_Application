import { Routes } from '@angular/router';
import { anonymousGuard, authGuard } from './core/auth/auth.guard';

// Every page is lazy, so a route only costs what it renders. Write routes pick up
// distributorGuard as they are built out in C7 and C8.
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tracks' },
  {
    path: 'login',
    title: 'Sign in',
    canActivate: [anonymousGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'tracks',
    title: 'Tracks',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tracks/pages/track-list/track-list').then((m) => m.TrackList),
  },
  {
    path: 'tracks/:id',
    title: 'Track',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tracks/pages/track-detail/track-detail').then((m) => m.TrackDetail),
  },
  {
    path: 'artists',
    title: 'Artists',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/artists/pages/artist-list/artist-list').then((m) => m.ArtistList),
  },
  {
    path: 'genres',
    title: 'Genres',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/genres/pages/genre-list/genre-list').then((m) => m.GenreList),
  },
  {
    path: '**',
    title: 'Not found',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
