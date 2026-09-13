import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/** A token rather than a direct import so tests can point services at a stub origin. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl,
});
