import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-artist-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Artists</h1>
    <p class="muted">Artist management arrives in phase C8.</p>
  `,
})
export class ArtistList {}
