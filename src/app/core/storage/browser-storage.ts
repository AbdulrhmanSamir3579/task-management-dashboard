import { DOCUMENT, Injectable, inject } from '@angular/core';

/**
 * `localStorage` for small per-browser preferences, such as which activity was last seen.
 * Storage can be missing or throw (private windows, blocked site data, a full quota);
 * reads then return `null` and writes are skipped, so the app works without it.
 */
@Injectable({ providedIn: 'root' })
export class BrowserStorage {
  private readonly window = inject(DOCUMENT).defaultView;

  get(key: string): string | null {
    try {
      return this.window?.localStorage.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      this.window?.localStorage.setItem(key, value);
    } catch {
      // Not stored; the preference lasts until the page is closed.
    }
  }
}
