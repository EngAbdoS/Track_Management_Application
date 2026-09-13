import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-genre-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Genres</h1>
    <p class="muted">The genre list and picker arrive in phase C8.</p>
  `,
})
export class GenreList {}
