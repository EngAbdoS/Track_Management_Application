import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-track-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Tracks</h1>
    <p class="muted">The catalogue list, filters and paging arrive in phase C5.</p>
  `,
})
export class TrackList {}
