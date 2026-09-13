import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Sign in</h1>
    <p class="muted">
      The API authenticates every endpoint, including reads, so this screen gates the whole app.
      Built in phase C3.
    </p>
  `,
})
export class Login {}
