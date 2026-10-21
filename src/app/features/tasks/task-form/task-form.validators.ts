import type { AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { type Observable, catchError, map, of, switchMap, take, timer } from 'rxjs';

// Each error carries its own message, which `ui-form-field` shows as is.

/** Fails for text made only of spaces. Combine with `Validators.required` for empty text. */
export const notBlank: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.length > 0 && control.value.trim() === ''
    ? { blank: 'Use letters or numbers, not only spaces.' }
    : null;

/**
 * `YYYY-MM-DD` on or after `today()`. `keep` is a date that stays valid even if it has
 * passed, so editing an overdue task does not force a new due date.
 */
export function dateNotBefore(today: () => string, keep?: string | null): ValidatorFn {
  return (control) => {
    const value = control.value as string | null;
    if (!value || value === keep) {
      return null;
    }
    return value < today() ? { dateInPast: 'Pick today or a later date.' } : null;
  };
}

/** `YYYY-MM-DD` on or before `today()`. */
export function dateNotAfter(today: () => string): ValidatorFn {
  return (control) => {
    const value = control.value as string | null;
    return value && value > today() ? { dateInFuture: 'This date cannot be in the future.' } : null;
  };
}

export function maxItems(max: number): ValidatorFn {
  return (control) => {
    const items = (control.value as readonly unknown[] | null) ?? [];
    return items.length > max ? { maxItems: `Use at most ${max} tags.` } : null;
  };
}

export function maxItemLength(max: number): ValidatorFn {
  return (control) => {
    const items = (control.value as readonly string[] | null) ?? [];
    return items.some((item) => item.length > max)
      ? { itemTooLong: `Each tag can have at most ${max} characters.` }
      : null;
  };
}

/**
 * Async check that no other task has the same title. It waits for a pause in typing;
 * Angular cancels the pending check when the value changes again. A failed check never
 * blocks saving: the server validates as well.
 */
export function uniqueTitle(
  isTaken: (title: string) => Observable<boolean>,
  debounceMs = 300,
): AsyncValidatorFn {
  return (control) => {
    const title = typeof control.value === 'string' ? control.value.trim() : '';
    if (!title) {
      return of(null);
    }
    return timer(debounceMs).pipe(
      switchMap(() => isTaken(title)),
      map((taken) => (taken ? { titleTaken: 'A task with this title already exists.' } : null)),
      catchError(() => of(null)),
      take(1),
    );
  };
}
