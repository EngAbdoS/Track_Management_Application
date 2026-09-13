import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { describeApiError, parseApiError, toControlName } from '../../../../core/http/api-error';
import { ToastStore } from '../../../../core/notifications/toast.store';
import { Button } from '../../../../shared/ui/button/button';
import { Field } from '../../../../shared/ui/field/field';
import { ArtistsApi } from '../../data/artists.api';
import { countryOptions } from '../../data/countries';

@Component({
  selector: 'app-artist-form',
  imports: [ReactiveFormsModule, RouterLink, Field, Button],
  templateUrl: './artist-form.html',
  styleUrl: './artist-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtistForm {
  private readonly api = inject(ArtistsApi);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastStore);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly id = input<string | undefined>();

  protected readonly countries = countryOptions();
  protected readonly isEdit = computed(() => !!this.id());
  protected readonly loading = signal(false);
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly serverFieldErrors = signal<Record<string, string>>({});

  protected readonly form = this.formBuilder.group({
    name: this.formBuilder.control('', Validators.required),
    email: this.formBuilder.control('', [Validators.required, Validators.email]),
    country: this.formBuilder.control('', Validators.required),
  });

  constructor() {
    effect(() => {
      const id = this.id();

      if (id) {
        void this.loadArtist(id);
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

    return field.hasError('email') ? 'Enter a valid email address.' : 'This field is required.';
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.error.set(null);
    this.serverFieldErrors.set({});

    const id = this.id();
    const value = this.form.getRawValue();

    try {
      await (id ? this.api.update(id, value) : this.api.create(value));
      // The picker list is now out of date for every track form in this session.
      await this.api.loadPickerOptions(true);

      this.toasts.success(id ? 'Artist updated.' : 'Artist added.');
      await this.router.navigate(['/artists']);
    } catch (cause) {
      this.handleFailure(cause);
    } finally {
      this.pending.set(false);
    }
  }

  private async loadArtist(id: string): Promise<void> {
    this.loading.set(true);

    try {
      const artist = await this.api.getById(id);
      this.form.patchValue({
        name: artist.name,
        email: artist.email,
        country: artist.country,
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
      return;
    }

    // A duplicate email answers 409 with its own sentence. It is a fact about one field,
    // so it belongs against that field rather than in a banner at the top of the form.
    if (failure.kind === 'message' && failure.status === 409) {
      this.serverFieldErrors.set({ email: failure.detail });
      return;
    }

    if (failure.kind === 'server' || failure.kind === 'offline') {
      return;
    }

    this.error.set(describeApiError(failure));
  }
}
