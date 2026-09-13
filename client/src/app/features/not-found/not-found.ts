import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Page not found</h1>
    <p class="muted">That route does not exist.</p>
    <p><a routerLink="/tracks">Back to tracks</a></p>
  `,
})
export class NotFound {}
