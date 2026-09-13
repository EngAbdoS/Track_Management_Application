import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';

/**
 * Built on the native <dialog> with showModal(), which brings the focus trap, Esc to
 * close, focus restoration and an inert background with it. A hand-rolled modal would
 * re-implement all four, usually incompletely.
 *
 * Declarative: the parent owns `open`, and `closed` fires for every route out —
 * including Esc and a backdrop click — so the parent's signal stays in step.
 */
@Component({
  selector: 'app-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog (close)="closed.emit()" (click)="onBackdropClick($event)">
      <div class="dialog__panel">
        <div class="dialog__head">
          <h2>{{ heading() }}</h2>
          <button type="button" class="dialog__close" aria-label="Close" (click)="closed.emit()">
            &times;
          </button>
        </div>

        <div class="dialog__body">
          <ng-content />
        </div>

        <div class="dialog__foot">
          <ng-content select="[dialog-actions]" />
        </div>
      </div>
    </dialog>
  `,
  styles: `
    dialog {
      padding: 0;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      background: var(--surface);
      color: var(--text);
      box-shadow: var(--shadow-2);
      width: min(520px, calc(100vw - var(--space-6)));
    }

    dialog::backdrop {
      background: var(--overlay);
    }

    .dialog__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-4);
      border-block-end: 1px solid var(--border);
    }

    .dialog__close {
      width: 28px;
      height: 28px;
      padding: 0;
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-muted);
      font-size: var(--text-xl);
      line-height: 1;

      &:hover {
        background: var(--surface-2);
        color: var(--text);
      }
    }

    .dialog__body {
      padding: var(--space-4);
      max-height: min(60vh, 480px);
      overflow-y: auto;
    }

    .dialog__foot {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      padding: var(--space-4);
      border-block-start: 1px solid var(--border);
    }

    .dialog__foot:empty {
      display: none;
    }
  `,
})
export class Dialog {
  readonly heading = input.required<string>();
  readonly open = input(false);

  readonly closed = output<void>();

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const element = this.dialogRef().nativeElement;

      if (this.open()) {
        if (!element.open) {
          element.showModal();
        }
      } else if (element.open) {
        element.close();
      }
    });
  }

  protected onBackdropClick(event: MouseEvent): void {
    // A click on the <dialog> itself is the backdrop; the panel inside stops it going
    // further, so anything landing here came from outside the content.
    if (event.target === this.dialogRef().nativeElement) {
      this.closed.emit();
    }
  }
}
