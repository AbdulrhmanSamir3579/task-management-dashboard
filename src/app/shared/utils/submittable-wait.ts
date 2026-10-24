import type { DebounceTimer } from '@angular/core';

export interface SubmittableWait<T> {
  /** Pass to Angular's `debounced()` as its wait. */
  readonly wait: DebounceTimer<T>;
  /** Uses `value` at once: ends its wait, or skips the wait if it has not started yet. */
  submit(value: T): void;
}

/**
 * A debounce wait for Angular's `debounced()` that the user can cut short, e.g. with
 * Enter. `delay` is read for every value, so it can depend on the data source; 0 uses
 * the value at once.
 *
 * `debounced()` starts the wait from an effect, so Enter can arrive before or after it
 * starts: a submitted value is matched either way.
 */
export function submittableWait<T>(delay: () => number): SubmittableWait<T> {
  let waiting: { value: T; timer: ReturnType<typeof setTimeout>; resolve: () => void } | null =
    null;
  let submitted: { value: T } | null = null;

  const release = (): void => {
    if (waiting) {
      clearTimeout(waiting.timer);
      const { resolve } = waiting;
      waiting = null;
      resolve();
    }
  };

  return {
    wait: (value) => {
      // A newer value replaces the one waiting; `debounced()` ignores the old wait.
      if (waiting) {
        clearTimeout(waiting.timer);
        waiting = null;
      }
      const skip = submitted !== null && Object.is(submitted.value, value);
      submitted = null;
      const ms = delay();
      if (skip || ms <= 0) {
        return undefined;
      }
      return new Promise<void>((resolve) => {
        waiting = { value, resolve, timer: setTimeout(release, ms) };
      });
    },
    submit: (value) => {
      if (waiting && Object.is(waiting.value, value)) {
        release();
      } else {
        submitted = { value };
      }
    },
  };
}
