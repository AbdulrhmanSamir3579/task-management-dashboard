import { DOCUMENT, Injectable, inject } from '@angular/core';
import type { PreloadingStrategy, Route } from '@angular/router';
import { Observable, shareReplay, switchMap } from 'rxjs';

/** Longest wait for an idle moment before preloading anyway. */
export const PRELOAD_IDLE_TIMEOUT_MS = 3000;

/**
 * Preloads every lazy page once the browser is idle after start-up, instead of right
 * after the first navigation, so the downloads do not compete with the first page and
 * its data (which slowed Largest Contentful Paint on mobile).
 */
@Injectable({ providedIn: 'root' })
export class IdlePreloadingStrategy implements PreloadingStrategy {
  private readonly window = inject(DOCUMENT).defaultView;

  /** One idle moment shared by all routes. */
  private readonly idle$ = new Observable<void>((subscriber) => {
    const done = () => {
      subscriber.next();
      subscriber.complete();
    };
    if (this.window?.requestIdleCallback) {
      const handle = this.window.requestIdleCallback(done, { timeout: PRELOAD_IDLE_TIMEOUT_MS });
      return () => this.window?.cancelIdleCallback(handle);
    }
    const timer = setTimeout(done, PRELOAD_IDLE_TIMEOUT_MS / 2);
    return () => clearTimeout(timer);
  }).pipe(shareReplay(1));

  preload(_route: Route, load: () => Observable<unknown>): Observable<unknown> {
    return this.idle$.pipe(switchMap(() => load()));
  }
}
