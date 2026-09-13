import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * An empty state that leads somewhere. "No tracks match this filter" with nothing to
 * press is a dead end, so the action slot is part of the component rather than an
 * afterthought at each call site.
 */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <p class="empty__title">{{ title() }}</p>
      @if (detail(); as text) {
        <p class="empty__detail muted">{{ text }}</p>
      }
      <div class="empty__action">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-7) var(--space-4);
      text-align: center;
    }

    .empty__title {
      font-weight: 600;
    }

    .empty__action:empty {
      display: none;
    }

    .empty__action {
      margin-block-start: var(--space-2);
    }
  `,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly detail = input<string | null>(null);
}
