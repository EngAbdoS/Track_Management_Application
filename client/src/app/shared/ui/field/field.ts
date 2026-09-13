import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Label, control and error message as one unit. The control is projected rather than
 * wrapped, so pages keep their own native inputs and selects — and the <label> element
 * wraps it, which is what associates the two without needing generated ids.
 */
@Component({
  selector: 'app-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="field">
      <span class="field__label">
        {{ label() }}
        @if (optional()) {
          <span class="field__optional">optional</span>
        }
      </span>

      <ng-content />

      @if (error(); as message) {
        <span class="field__error">{{ message }}</span>
      } @else if (hint(); as text) {
        <span class="field__hint">{{ text }}</span>
      }
    </label>
  `,
  styles: `
    .field {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      min-width: 0;

      &__label {
        display: flex;
        align-items: baseline;
        gap: var(--space-2);
        font-weight: 550;
      }

      &__optional {
        color: var(--text-muted);
        font-size: var(--text-xs);
        font-weight: 400;
      }

      &__error {
        color: var(--dsp-rejected);
        font-size: var(--text-sm);
      }

      &__hint {
        color: var(--text-muted);
        font-size: var(--text-sm);
      }
    }
  `,
})
export class Field {
  readonly label = input.required<string>();
  readonly error = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly optional = input(false);
}
