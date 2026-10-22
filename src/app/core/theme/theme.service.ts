import { DOCUMENT, DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { DARK_MODE_CLASS } from '../../shared/ui/provide-ui';
import { BrowserStorage } from '../storage/browser-storage';

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

/** Also read by the inline script in index.html, which applies the theme before start-up. */
export const THEME_STORAGE_KEY = 'task-manager.theme';

const isPreference = (value: string | null): value is ThemePreference =>
  THEME_PREFERENCES.includes(value as ThemePreference);

/**
 * Light, dark or the device's setting. The choice is kept in the browser; the resolved
 * theme is applied as the dark-mode class on `<html>`, which switches both the app's
 * design tokens and PrimeNG. Light is the default, as in the design.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = inject(BrowserStorage);
  private readonly darkQuery = this.document.defaultView?.matchMedia?.(
    '(prefers-color-scheme: dark)',
  );
  private readonly systemDark = signal(this.darkQuery?.matches ?? false);

  readonly preference = signal<ThemePreference>(this.storedPreference());
  readonly isDark = computed(
    () => this.preference() === 'dark' || (this.preference() === 'system' && this.systemDark()),
  );

  constructor() {
    const onSystemChange = (event: MediaQueryListEvent) => this.systemDark.set(event.matches);
    this.darkQuery?.addEventListener('change', onSystemChange);
    inject(DestroyRef).onDestroy(() =>
      this.darkQuery?.removeEventListener('change', onSystemChange),
    );

    effect(() => {
      this.document.documentElement.classList.toggle(DARK_MODE_CLASS, this.isDark());
    });
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
    this.storage.set(THEME_STORAGE_KEY, preference);
  }

  private storedPreference(): ThemePreference {
    const stored = this.storage.get(THEME_STORAGE_KEY);
    return isPreference(stored) ? stored : 'light';
  }
}
