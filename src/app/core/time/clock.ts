import { InjectionToken } from '@angular/core';

/** Returns the current time. Injected instead of calling `new Date()` so tests can control time. */
export const CLOCK = new InjectionToken<() => Date>('CLOCK', {
  providedIn: 'root',
  factory: () => () => new Date(),
});
