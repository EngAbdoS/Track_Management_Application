import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * An attribute selector, so the element stays a real <button> or <a> — keyboard
 * behaviour, form submission and disabled semantics come from the platform rather
 * than being re-implemented.
 */
@Component({
  selector: 'button[appButton], a[appButton]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  host: {
    '[class]': '"btn btn--" + variant() + (small() ? " btn--small" : "")',
  },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      border: 1px solid transparent;
      border-radius: var(--radius);
      font-weight: 600;
      text-decoration: none;
      white-space: nowrap;
      cursor: pointer;
      transition:
        background var(--t-fast),
        border-color var(--t-fast),
        color var(--t-fast);
    }

    :host(.btn--small) {
      padding: var(--space-1) var(--space-3);
      font-size: var(--text-sm);
    }

    :host(.btn--primary) {
      background: var(--accent);
      color: var(--accent-contrast);

      &:hover:not(:disabled) {
        background: var(--accent-hover);
      }
    }

    :host(.btn--secondary) {
      border-color: var(--border-strong);
      background: var(--surface);
      color: var(--text);

      &:hover:not(:disabled) {
        background: var(--surface-2);
      }
    }

    :host(.btn--ghost) {
      background: transparent;
      color: var(--text-muted);

      &:hover:not(:disabled) {
        background: var(--surface-2);
        color: var(--text);
      }
    }

    :host(.btn--danger) {
      border-color: var(--dsp-rejected);
      background: transparent;
      color: var(--dsp-rejected);

      &:hover:not(:disabled) {
        background: color-mix(in srgb, var(--dsp-rejected) 12%, transparent);
      }
    }

    :host(:disabled) {
      opacity: 0.55;
      cursor: not-allowed;
    }
  `,
})
export class Button {
  readonly variant = input<ButtonVariant>('secondary');
  /** Bare attribute: <button appButton small>. */
  readonly small = input(false, { transform: booleanAttribute });
}
