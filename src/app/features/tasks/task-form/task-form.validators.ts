import type { AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { type Observable, catchError, map, of, switchMap, take, timer } from 'rxjs';
import type { TranslationKey } from '../../../core/i18n/translation-key';
import type { ValidationMessage } from '../../../shared/ui/form-field/form-field';

// Each error carries its message as a translation key, which `ui-form-field` shows in the
// user's language.
const message = (key: TranslationKey, params?: Record<string, unknown>): ValidationMessage => ({
  key,
  ...(params ? { params } : {}),
});

/** Fails for text made only of spaces. Combine with `Validators.required` for empty text. */
export const notBlank: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.length > 0 && control.value.trim() === ''
    ? { blank: message('VALIDATION.BLANK') }
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
    return value < today() ? { dateInPast: message('VALIDATION.DATE_IN_PAST') } : null;
  };
}

/** `YYYY-MM-DD` on or before `today()`. */
export function dateNotAfter(today: () => string): ValidatorFn {
  return (control) => {
    const value = control.value as string | null;
    return value && value > today() ? { dateInFuture: message('VALIDATION.DATE_IN_FUTURE') } : null;
  };
}

/** At most `max` items; `messageKey` names the items, e.g. "Use at most 5 tags." */
export function maxItems(max: number, messageKey: TranslationKey): ValidatorFn {
  return (control) => {
    const items = (control.value as readonly unknown[] | null) ?? [];
    return items.length > max ? { maxItems: message(messageKey, { max }) } : null;
  };
}

export function maxItemLength(max: number): ValidatorFn {
  return (control) => {
    const items = (control.value as readonly string[] | null) ?? [];
    return items.some((item) => item.length > max)
      ? { itemTooLong: message('VALIDATION.ITEM_TOO_LONG', { max }) }
      : null;
  };
}

/** Sync version of `uniqueTitle`, for places where every task is already loaded. */
export function titleNotTaken(isTaken: (title: string) => boolean): ValidatorFn {
  return (control) => {
    const title = typeof control.value === 'string' ? control.value.trim() : '';
    return title && isTaken(title) ? { titleTaken: message('VALIDATION.TITLE_TAKEN') } : null;
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
      map((taken) => (taken ? { titleTaken: message('VALIDATION.TITLE_TAKEN') } : null)),
      catchError(() => of(null)),
      take(1),
    );
  };
}
