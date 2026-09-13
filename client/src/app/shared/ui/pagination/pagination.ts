import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Button } from '../button/button';

/**
 * Driven entirely by the response envelope. The API clamps pageSize (100 max) and
 * coerces out-of-range pages rather than rejecting them, so every number shown here
 * comes from what the server actually returned, never from what was requested.
 */
@Component({
  selector: 'app-pagination',
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="pager" aria-label="Pagination">
      <p class="pager__count muted num">
        @if (totalCount() === 0) {
          No results
        } @else {
          {{ firstOnPage() }}–{{ lastOnPage() }} of {{ totalCount() }}
        }
      </p>

      <div class="pager__controls">
        <button appButton small type="button" [disabled]="page() <= 1" (click)="goTo.emit(page() - 1)">
          Previous
        </button>
        <span class="pager__page num">Page {{ page() }} of {{ Math.max(totalPages(), 1) }}</span>
        <button
          appButton
          small
          type="button"
          [disabled]="page() >= totalPages()"
          (click)="goTo.emit(page() + 1)"
        >
          Next
        </button>
      </div>
    </nav>
  `,
  styles: `
    .pager {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      flex-wrap: wrap;
      padding-block-start: var(--space-3);
    }

    .pager__controls {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .pager__page {
      color: var(--text-muted);
      font-size: var(--text-sm);
    }
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalCount = input.required<number>();
  readonly totalPages = input.required<number>();

  readonly goTo = output<number>();

  protected readonly Math = Math;

  protected readonly firstOnPage = computed(() => (this.page() - 1) * this.pageSize() + 1);
  protected readonly lastOnPage = computed(() =>
    Math.min(this.page() * this.pageSize(), this.totalCount()),
  );
}
