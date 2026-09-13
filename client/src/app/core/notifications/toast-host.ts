import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastStore } from './toast.store';

@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Polite, not assertive: a toast should not interrupt a screen reader mid-sentence. -->
    <div class="host" role="status" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [class]="'toast--' + toast.tone">
          <span class="toast__text">{{ toast.text }}</span>
          <button type="button" class="toast__close" aria-label="Dismiss" (click)="toasts.dismiss(toast.id)">
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .host {
      position: fixed;
      inset-block-end: var(--space-5);
      inset-inline-end: var(--space-5);
      z-index: 60;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      width: min(380px, calc(100vw - var(--space-6)));
      pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-3) var(--space-3) var(--space-4);
      border: 1px solid var(--border);
      border-inline-start: 3px solid var(--tone, var(--border-strong));
      border-radius: var(--radius);
      background: var(--surface);
      box-shadow: var(--shadow-2);
      animation: toast-in 160ms ease-out;
    }

    .toast--success {
      --tone: var(--dsp-live);
    }

    .toast--error {
      --tone: var(--dsp-rejected);
    }

    .toast--info {
      --tone: var(--accent);
    }

    .toast__text {
      flex: 1;
    }

    .toast__close {
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      padding: 0;
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-muted);
      font-size: var(--text-lg);
      line-height: 1;

      &:hover {
        background: var(--surface-2);
        color: var(--text);
      }
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(6px);
      }
    }
  `,
})
export class ToastHost {
  protected readonly toasts = inject(ToastStore);
}
