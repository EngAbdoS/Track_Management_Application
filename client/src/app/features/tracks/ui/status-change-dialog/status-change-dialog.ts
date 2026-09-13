import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { Button } from '../../../../shared/ui/button/button';
import { Dialog } from '../../../../shared/ui/dialog/dialog';
import { Field } from '../../../../shared/ui/field/field';

export interface StatusChangeSubmission {
  status: string;
  reason: string | null;
}

const REASON_MAX = 1000;

/**
 * Serves both status levels. The caller supplies the options, which is where the two
 * differ: a track status is a manual override and may be any value, while a DSP status
 * is offered only the transitions that make sense from where it is now.
 */
@Component({
  selector: 'app-status-change-dialog',
  imports: [Dialog, Field, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog [heading]="heading()" [open]="open()" (closed)="cancelled.emit()">
      <div class="body">
        <p class="muted">
          Currently <strong>{{ current() }}</strong
          >.
        </p>

        @if (options().length === 0) {
          <p class="muted">There is no further transition from this status.</p>
        } @else {
          <app-field label="New status">
            <select [disabled]="pending()" (change)="status.set($any($event.target).value)">
              @for (option of options(); track option) {
                <option [value]="option" [selected]="option === status()">{{ option }}</option>
              }
            </select>
          </app-field>

          <app-field
            label="Reason"
            optional
            [hint]="reasonHint()"
            [error]="reasonTooLong() ? 'Keep the reason under ' + REASON_MAX + ' characters.' : null"
          >
            <textarea
              rows="3"
              [value]="reason()"
              [disabled]="pending()"
              (input)="reason.set($any($event.target).value)"
            ></textarea>
          </app-field>
        }

        @if (error(); as message) {
          <p class="error" role="alert">{{ message }}</p>
        }
      </div>

      <ng-container dialog-actions>
        <button appButton type="button" [disabled]="pending()" (click)="cancelled.emit()">
          Cancel
        </button>
        <button
          appButton
          variant="primary"
          type="button"
          [disabled]="pending() || options().length === 0 || reasonTooLong()"
          (click)="confirm()"
        >
          {{ pending() ? 'Saving…' : 'Update status' }}
        </button>
      </ng-container>
    </app-dialog>
  `,
  styles: `
    .body {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    textarea {
      resize: vertical;
    }

    .error {
      color: var(--dsp-rejected);
    }
  `,
})
export class StatusChangeDialog {
  readonly heading = input.required<string>();
  readonly current = input.required<string>();
  readonly options = input.required<readonly string[]>();
  readonly open = input(false);
  readonly pending = input(false);
  readonly error = input<string | null>(null);

  readonly confirmed = output<StatusChangeSubmission>();
  readonly cancelled = output<void>();

  protected readonly REASON_MAX = REASON_MAX;
  protected readonly status = signal('');
  protected readonly reason = signal('');

  protected readonly reasonTooLong = () => this.reason().length > REASON_MAX;

  constructor() {
    // Reopening must not show the previous attempt's answers.
    effect(() => {
      if (this.open()) {
        this.status.set(this.options()[0] ?? '');
        this.reason.set('');
      }
    });
  }

  protected reasonHint(): string {
    return needsExplaining(this.status())
      ? 'Recorded on the audit trail — worth filling in for this one.'
      : 'Recorded on the audit trail.';
  }

  protected confirm(): void {
    this.confirmed.emit({ status: this.status(), reason: this.reason().trim() || null });
  }
}

function needsExplaining(status: string): boolean {
  return status === 'Rejected' || status === 'Paused' || status === 'Blocked';
}
