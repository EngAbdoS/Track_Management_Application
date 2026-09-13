import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (heading(); as title) {
      <div class="card__head">
        <h2>{{ title }}</h2>
        <ng-content select="[card-actions]" />
      </div>
    }
    <div class="card__body">
      <ng-content />
    </div>
  `,
  styles: `
    :host {
      display: block;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      background: var(--surface);
    }

    .card__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-4);
      border-block-end: 1px solid var(--border);
    }

    .card__body {
      padding: var(--space-4);
    }
  `,
})
export class Card {
  readonly heading = input<string | null>(null);
}
