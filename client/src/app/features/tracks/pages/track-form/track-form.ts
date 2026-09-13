import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { describeApiError, parseApiError, toControlName } from '../../../../core/http/api-error';
import { ToastStore } from '../../../../core/notifications/toast.store';
import { Button } from '../../../../shared/ui/button/button';
import { Field } from '../../../../shared/ui/field/field';
import { ArtistsApi } from '../../../artists/data/artists.api';
import { GenresApi } from '../../../genres/data/genres.api';
import { GenrePicker } from '../../../genres/ui/genre-picker/genre-picker';
import { TracksApi } from '../../data/tracks.api';

@Component({
  selector: 'app-track-form',
  imports: [ReactiveFormsModule, RouterLink, Field, Button, GenrePicker],
  templateUrl: './track-form.html',
  styleUrl: './track-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackForm {
  private readonly api = inject(TracksApi);
  private readonly artistsApi = inject(ArtistsApi);
  private readonly genresApi = inject(GenresApi);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastStore);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  /** Present on /tracks/:id/edit, absent on /tracks/new. */
  readonly id = input<string | undefined>();

  protected readonly artists = this.artistsApi.pickerOptions;
  protected readonly genres = this.genresApi.options;

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly loading = signal(false);
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly serverFieldErrors = signal<Record<string, string>>({});
  protected readonly artistName = signal<string | null>(null);

  protected readonly form = this.formBuilder.group({
    title: this.formBuilder.control('', Validators.required),
    artistId: this.formBuilder.control('', Validators.required),
    genreId: this.formBuilder.control('', Validators.required),
    isrc: this.formBuilder.control('', [Validators.required, isrcShape]),
    releaseDate: this.formBuilder.control('', Validators.required),
  });

  constructor() {
    void this.artistsApi.loadPickerOptions();
    void this.genresApi.loadOptions();

    effect(() => {
      const id = this.id();

      if (id) {
        void this.loadTrack(id);
      }
    });
  }

  protected errorFor(control: keyof typeof this.form.controls): string | null {
    const server = this.serverFieldErrors()[control];

    if (server) {
      return server;
    }

    const field = this.form.controls[control];

    if (!field.invalid || (!field.touched && !field.dirty)) {
      return null;
    }

    return field.hasError('isrc')
      ? 'ISRC must be 12 characters: 2 letters, 3 letters or digits, then 7 digits.'
      : 'This field is required.';
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.error.set(null);
    this.serverFieldErrors.set({});

    const value = this.form.getRawValue();

    try {
      const id = this.id();

      const saved = id
        ? // No artistId: the API has no field for it, because moving a track between
          // artists is a catalogue transfer rather than an edit.
          await this.api.update(id, {
            title: value.title,
            genreId: value.genreId,
            isrc: value.isrc,
            releaseDate: value.releaseDate,
          })
        : await this.api.create(value);

      this.toasts.success(id ? 'Track updated.' : 'Track created as a draft.');
      await this.router.navigate(['/tracks', saved.id]);
    } catch (cause) {
      this.handleFailure(cause);
    } finally {
      this.pending.set(false);
    }
  }

  private async loadTrack(id: string): Promise<void> {
    this.loading.set(true);

    try {
      const track = await this.api.getById(id);

      this.artistName.set(track.artistName);
      this.form.patchValue({
        title: track.title,
        artistId: track.artistId,
        genreId: track.genreId,
        isrc: track.isrc,
        releaseDate: track.releaseDate,
      });
    } catch (cause) {
      this.error.set(describeApiError(parseApiError(cause)));
    } finally {
      this.loading.set(false);
    }
  }

  private handleFailure(cause: unknown): void {
    const failure = parseApiError(cause);

    if (failure.kind === 'validation') {
      const mapped: Record<string, string> = {};

      for (const [field, messages] of Object.entries(failure.fields)) {
        mapped[toControlName(field)] = messages[0];
      }

      this.serverFieldErrors.set(mapped);

      // A key that matches no control (the API uses "body" for a payload that would not
      // bind) would otherwise be swallowed silently.
      const unmatched = Object.keys(mapped).filter((key) => !(key in this.form.controls));
      this.error.set(unmatched.length > 0 ? mapped[unmatched[0]] : null);
      return;
    }

    if (failure.kind === 'server' || failure.kind === 'offline') {
      return;
    }

    this.error.set(describeApiError(failure));
  }
}

/**
 * Shape only. The API owns the real rules, and a stricter client check would reject
 * legitimate codes: the prefix may be an ISRC registrant allocation (QM, QZ, ZZ) rather
 * than a country, and the two-digit year is not range-checked because back-catalogue
 * registrations carry old years.
 */
function isrcShape(control: AbstractControl<string>): ValidationErrors | null {
  const normalized = control.value.replace(/[\s-]/g, '').toUpperCase();

  if (!normalized) {
    return null;
  }

  return /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(normalized) ? null : { isrc: true };
}
