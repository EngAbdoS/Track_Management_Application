import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TrackMetadataDto, UpdateMetadataRequest } from '../../../../models/api.models';
import { Button } from '../../../../shared/ui/button/button';
import { Dialog } from '../../../../shared/ui/dialog/dialog';
import { Field } from '../../../../shared/ui/field/field';

/**
 * PUT /metadata is a **replace**: any field left out is cleared server-side. The form is
 * therefore always seeded with the complete current object and always submits every
 * field, including the ones the user never touched. Sending only the edited fields would
 * silently wipe the rest.
 */
@Component({
  selector: 'app-metadata-form',
  imports: [ReactiveFormsModule, Dialog, Field, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog heading="Edit metadata" [open]="open()" (closed)="cancelled.emit()">
      <form class="grid" [formGroup]="form" novalidate>
        <app-field label="Duration (seconds)" optional [error]="errorFor('durationSeconds')">
          <input type="number" min="1" formControlName="durationSeconds" />
        </app-field>

        <app-field label="BPM" optional [error]="errorFor('bpm')" hint="Between 20 and 300.">
          <input type="number" min="20" max="300" formControlName="bpm" />
        </app-field>

        <app-field label="ISWC" optional [error]="errorFor('iswc')" hint="Identifies the composition.">
          <input type="text" formControlName="iswc" placeholder="T-123456789-0" />
        </app-field>

        <app-field label="Language" optional [error]="errorFor('language')" hint="Two letters, e.g. ar.">
          <input type="text" formControlName="language" maxlength="2" autocapitalize="none" />
        </app-field>

        <app-field label="Label" optional [error]="errorFor('label')">
          <input type="text" formControlName="label" />
        </app-field>

        <app-field label="Copyright line" optional [error]="errorFor('copyrightLine')">
          <input type="text" formControlName="copyrightLine" placeholder="℗ 2026 Rotana" />
        </app-field>

        <app-field
          label="Cover art URL"
          optional
          class="span"
          [error]="errorFor('coverArtUrl')"
          hint="Absolute http or https URL."
        >
          <input type="url" formControlName="coverArtUrl" />
        </app-field>

        <label class="explicit">
          <input type="checkbox" formControlName="isExplicit" />
          <span>Explicit content</span>
        </label>
      </form>

      <p class="muted note">
        Every field is saved together — clearing one here clears it on the track.
      </p>

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
          [disabled]="pending() || form.invalid"
          (click)="submit()"
        >
          {{ pending() ? 'Saving…' : 'Save metadata' }}
        </button>
      </ng-container>
    </app-dialog>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
    }

    .span {
      grid-column: 1 / -1;
    }

    .explicit {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .note {
      margin-block-start: var(--space-4);
      font-size: var(--text-sm);
    }

    .error {
      margin-block-start: var(--space-3);
      color: var(--dsp-rejected);
    }
  `,
})
export class MetadataForm {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly metadata = input<TrackMetadataDto | null>(null);
  readonly open = input(false);
  readonly pending = input(false);
  readonly error = input<string | null>(null);
  readonly fieldErrors = input<Record<string, string> | null>(null);

  readonly saved = output<UpdateMetadataRequest>();
  readonly cancelled = output<void>();

  protected readonly form = this.formBuilder.group({
    durationSeconds: this.formBuilder.control<number | null>(null, Validators.min(1)),
    bpm: this.formBuilder.control<number | null>(null, [Validators.min(20), Validators.max(300)]),
    iswc: this.formBuilder.control(''),
    language: this.formBuilder.control('', Validators.maxLength(2)),
    isExplicit: this.formBuilder.control(false),
    label: this.formBuilder.control(''),
    coverArtUrl: this.formBuilder.control(''),
    copyrightLine: this.formBuilder.control(''),
  });

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }

      const current = this.metadata();

      this.form.reset({
        durationSeconds: current?.durationSeconds ?? null,
        bpm: current?.bpm ?? null,
        iswc: current?.iswc ?? '',
        language: current?.language ?? '',
        isExplicit: current?.isExplicit ?? false,
        label: current?.label ?? '',
        coverArtUrl: current?.coverArtUrl ?? '',
        copyrightLine: current?.copyrightLine ?? '',
      });
    });
  }

  protected errorFor(control: keyof typeof this.form.controls): string | null {
    return this.fieldErrors()?.[control] ?? null;
  }

  protected submit(): void {
    const value = this.form.getRawValue();

    // The API distinguishes "cleared" from "unset" only by null, so empty text boxes are
    // sent as null rather than as empty strings.
    this.saved.emit({
      durationSeconds: value.durationSeconds,
      bpm: value.bpm,
      iswc: blankToNull(value.iswc),
      language: blankToNull(value.language)?.toLowerCase() ?? null,
      isExplicit: value.isExplicit,
      label: blankToNull(value.label),
      coverArtUrl: blankToNull(value.coverArtUrl),
      copyrightLine: blankToNull(value.copyrightLine),
    });
  }
}

function blankToNull(value: string): string | null {
  return value.trim() || null;
}
