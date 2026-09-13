import { Injectable, signal } from '@angular/core';

export type ToastTone = 'info' | 'success' | 'error';

export interface Toast {
  id: number;
  tone: ToastTone;
  text: string;
}

const DISMISS_AFTER: Record<ToastTone, number> = {
  info: 4000,
  success: 4000,
  // Errors stay longer: they usually carry something the user has to read and act on.
  error: 8000,
};

@Injectable({ providedIn: 'root' })
export class ToastStore {
  private nextId = 1;
  private readonly _toasts = signal<Toast[]>([]);

  readonly toasts = this._toasts.asReadonly();

  info(text: string): void {
    this.show(text, 'info');
  }

  success(text: string): void {
    this.show(text, 'success');
  }

  error(text: string): void {
    this.show(text, 'error');
  }

  dismiss(id: number): void {
    this._toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private show(text: string, tone: ToastTone): void {
    const id = this.nextId++;
    this._toasts.update((toasts) => [...toasts, { id, tone, text }]);
    setTimeout(() => this.dismiss(id), DISMISS_AFTER[tone]);
  }
}
