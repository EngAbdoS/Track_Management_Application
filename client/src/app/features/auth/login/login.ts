import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthStore } from '../../../core/auth/auth.store';
import { describeApiError, parseApiError, toControlName } from '../../../core/http/api-error';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  /** Bound from ?returnUrl= by withComponentInputBinding(). */
  readonly returnUrl = input<string>();

  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showDevAccounts = !environment.production;

  protected readonly form = this.formBuilder.group({
    username: this.formBuilder.control('', Validators.required),
    password: this.formBuilder.control('', Validators.required),
  });

  protected readonly destination = computed(() => safeInternalUrl(this.returnUrl()) ?? '/tracks');

  protected isInvalid(control: 'username' | 'password'): boolean {
    const field = this.form.controls[control];
    return field.invalid && (field.touched || field.dirty);
  }

  protected errorFor(control: 'username' | 'password'): string {
    const errors = this.form.controls[control].errors;

    if (!errors) {
      return '';
    }

    // A server message is more specific than anything the client knows, so it wins.
    return typeof errors['server'] === 'string' ? errors['server'] : 'This field is required.';
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.error.set(null);

    try {
      await this.auth.login(this.form.getRawValue());
      await this.router.navigateByUrl(this.destination());
    } catch (cause) {
      this.handleFailure(cause);
    } finally {
      this.pending.set(false);
    }
  }

  private handleFailure(cause: unknown): void {
    const failure = parseApiError(cause);

    if (failure.kind === 'validation') {
      for (const [field, messages] of Object.entries(failure.fields)) {
        this.form.get(toControlName(field))?.setErrors({ server: messages[0] });
      }
      this.error.set(null);
      return;
    }

    // A 5xx or an unreachable API already raised a toast in the error interceptor;
    // repeating it in the form would say the same thing twice.
    if (failure.kind === 'server' || failure.kind === 'offline') {
      return;
    }

    this.error.set(describeApiError(failure));
  }
}

/**
 * `returnUrl` comes from the query string, so it is attacker-supplied. Only same-app
 * paths are honoured: a protocol-relative value like `//evil.example` would otherwise
 * be an open redirect off the origin.
 */
function safeInternalUrl(url: string | undefined): string | null {
  return url && url.startsWith('/') && !url.startsWith('//') ? url : null;
}
