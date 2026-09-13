import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Placeholder rows while a list loads. A skeleton keeps the layout stable where a
 * centred spinner makes the page jump when content arrives.
 */
@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton" [attr.aria-label]="label()" role="status">
      @for (row of rowList(); track row) {
        <div class="skeleton__row"></div>
      }
    </div>
  `,
  styles: `
    .skeleton {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-4);
    }

    .skeleton__row {
      height: 18px;
      border-radius: var(--radius-sm);
      background: linear-gradient(
        90deg,
        var(--surface-2) 25%,
        color-mix(in srgb, var(--surface-2) 55%, var(--border)) 37%,
        var(--surface-2) 63%
      );
      background-size: 400% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }

    @keyframes shimmer {
      from {
        background-position: 100% 50%;
      }
      to {
        background-position: 0 50%;
      }
    }
  `,
})
export class Skeleton {
  readonly rows = input(5);
  readonly label = input('Loading');

  protected readonly rowList = () => Array.from({ length: this.rows() }, (_, index) => index);
}
