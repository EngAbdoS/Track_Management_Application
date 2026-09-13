import { Injectable, computed, effect, signal } from '@angular/core';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'tm.theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly _preference = signal<ThemePreference>(readStoredPreference());
  private readonly systemDark = signal(prefersDark());

  readonly preference = this._preference.asReadonly();

  /** What is actually on screen — the toggle icon and aria-label read this, not the preference. */
  readonly resolved = computed<ResolvedTheme>(() => {
    const preference = this._preference();
    return preference === 'system' ? (this.systemDark() ? 'dark' : 'light') : preference;
  });

  constructor() {
    watchSystemTheme((isDark) => this.systemDark.set(isDark));

    effect(() => {
      const preference = this._preference();
      const root = document.documentElement;

      if (preference === 'system') {
        root.removeAttribute('data-theme');
      } else {
        root.setAttribute('data-theme', preference);
      }

      try {
        localStorage.setItem(STORAGE_KEY, preference);
      } catch {
        // Storage can be unavailable (private browsing); the theme still applies
        // for this session, it just will not be remembered.
      }
    });
  }

  set(preference: ThemePreference): void {
    this._preference.set(preference);
  }

  /**
   * Flips to the opposite of what is currently rendered. Before the first toggle
   * the preference is 'system', so this picks the opposite of the OS setting.
   */
  toggle(): void {
    this._preference.set(this.resolved() === 'dark' ? 'light' : 'dark');
  }
}

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // See the effect above.
  }
  return 'system';
}

// jsdom implements neither matchMedia nor its change events, so both helpers
// degrade to light rather than throwing under test.
function prefersDark(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(DARK_QUERY).matches;
}

function watchSystemTheme(onChange: (isDark: boolean) => void): void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return;
  }
  window.matchMedia(DARK_QUERY).addEventListener('change', (event) => onChange(event.matches));
}
