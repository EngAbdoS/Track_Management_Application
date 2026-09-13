import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-track-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Track</h1>
    <p class="muted">
      Detail, distributions and the audit timeline arrive in phase C6. Route id:
      <span class="code">{{ id() }}</span>
    </p>
  `,
})
export class TrackDetail {
  /** Bound from the :id route param by withComponentInputBinding(). */
  readonly id = input.required<string>();
}
