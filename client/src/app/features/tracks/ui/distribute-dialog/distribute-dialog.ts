import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { DspDto, TrackDistributionDto } from '../../../../models/api.models';
import { Button } from '../../../../shared/ui/button/button';
import { Dialog } from '../../../../shared/ui/dialog/dialog';
import { DspStatus } from '../../../../shared/ui/status/dsp-status';

@Component({
  selector: 'app-distribute-dialog',
  imports: [Dialog, Button, DspStatus],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog heading="Distribute track" [open]="open()" (closed)="cancelled.emit()">
      <fieldset class="list" [disabled]="pending()">
        <legend class="sr-only">Digital service providers</legend>

        @for (dsp of dsps(); track dsp.id) {
          <label class="row" [class.row--taken]="existing(dsp.id) !== undefined">
            <input
              type="checkbox"
              [checked]="selected().has(dsp.id)"
              [disabled]="existing(dsp.id) !== undefined"
              (change)="toggle(dsp.id)"
            />
            <span class="row__name">{{ dsp.name }}</span>

            @if (existing(dsp.id); as current) {
              <span class="row__state">
                <span class="muted">already sent —</span>
                <app-dsp-status [status]="current.status" />
              </span>
            }
          </label>
        }
      </fieldset>

      @if (nothingLeft()) {
        <p class="muted note">This track has already been sent to every DSP.</p>
      }

      @if (error(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      }

      <ng-container dialog-actions>
        <button appButton type="button" [disabled]="pending()" (click)="cancelled.emit()">
          Cancel
        </button>
        <button
          appButton
          variant="primary"
          type="button"
          [disabled]="pending() || selected().size === 0"
          (click)="confirmed.emit([...selected()])"
        >
          {{ pending() ? 'Submitting…' : submitLabel() }}
        </button>
      </ng-container>
    </app-dialog>
  `,
  styles: `
    .list {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      border-radius: var(--radius);
      cursor: pointer;

      &:hover {
        background: var(--surface-2);
      }
    }

    .row--taken {
      cursor: default;
    }

    .row__name {
      font-weight: 550;
    }

    .row__state {
      margin-inline-start: auto;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
    }

    .note,
    .error {
      margin-block-start: var(--space-3);
    }

    .error {
      color: var(--dsp-rejected);
    }
  `,
})
export class DistributeDialog {
  readonly dsps = input.required<readonly DspDto[]>();
  readonly distributions = input.required<readonly TrackDistributionDto[]>();
  readonly open = input(false);
  readonly pending = input(false);
  readonly error = input<string | null>(null);

  readonly confirmed = output<string[]>();
  readonly cancelled = output<void>();

  protected readonly selected = signal<ReadonlySet<string>>(new Set());

  /**
   * A DSP the track already sits with is shown with its current status but cannot be
   * selected. The API would accept it and report it under alreadyDistributed, but
   * offering a checkbox that provably does nothing is not a kindness.
   */
  protected existing(dspId: string): TrackDistributionDto | undefined {
    return this.distributions().find((distribution) => distribution.dspId === dspId);
  }

  protected readonly nothingLeft = computed(
    () => this.dsps().length > 0 && this.dsps().every((dsp) => this.existing(dsp.id) !== undefined),
  );

  protected readonly submitLabel = computed(() => {
    const count = this.selected().size;
    return count <= 1 ? 'Submit' : `Submit to ${count} DSPs`;
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        this.selected.set(new Set());
      }
    });
  }

  protected toggle(dspId: string): void {
    this.selected.update((current) => {
      const next = new Set(current);

      if (!next.delete(dspId)) {
        next.add(dspId);
      }

      return next;
    });
  }
}
