import { FormControl } from '@angular/forms';
import { NEVER, of, throwError } from 'rxjs';
import {
  dateNotAfter,
  dateNotBefore,
  maxItemLength,
  maxItems,
  notBlank,
  uniqueTitle,
} from './task-form.validators';

const today = () => '2026-10-21';

describe('task form validators', () => {
  describe('notBlank', () => {
    it.each([
      ['   ', { blank: 'Use letters or numbers, not only spaces.' }],
      ['', null],
      [' Write docs ', null],
      [null, null],
    ])('checks %j', (value, expected) => {
      expect(notBlank(new FormControl(value))).toEqual(expected);
    });
  });

  describe('dateNotBefore', () => {
    it('rejects a date before today', () => {
      expect(dateNotBefore(today)(new FormControl('2026-10-20'))).toEqual({
        dateInPast: 'Pick today or a later date.',
      });
    });

    it('accepts today, later dates and an empty value', () => {
      const validator = dateNotBefore(today);
      expect(validator(new FormControl('2026-10-21'))).toBeNull();
      expect(validator(new FormControl('2026-11-01'))).toBeNull();
      expect(validator(new FormControl(null))).toBeNull();
    });

    it('keeps an existing past date valid while editing', () => {
      expect(dateNotBefore(today, '2026-10-01')(new FormControl('2026-10-01'))).toBeNull();
      expect(dateNotBefore(today, '2026-10-01')(new FormControl('2026-10-02'))).not.toBeNull();
    });
  });

  describe('dateNotAfter', () => {
    it('rejects a future date and accepts today or earlier', () => {
      const validator = dateNotAfter(today);
      expect(validator(new FormControl('2026-10-22'))).toEqual({
        dateInFuture: 'This date cannot be in the future.',
      });
      expect(validator(new FormControl('2026-10-21'))).toBeNull();
      expect(validator(new FormControl(null))).toBeNull();
    });
  });

  describe('tag limits', () => {
    it('limits the number of tags', () => {
      expect(maxItems(2)(new FormControl(['a', 'b', 'c']))).toEqual({
        maxItems: 'Use at most 2 tags.',
      });
      expect(maxItems(2)(new FormControl(['a', 'b']))).toBeNull();
      expect(maxItems(2)(new FormControl(null))).toBeNull();
    });

    it('limits the length of each tag', () => {
      expect(maxItemLength(3)(new FormControl(['abcd']))).toEqual({
        itemTooLong: 'Each tag can have at most 3 characters.',
      });
      expect(maxItemLength(3)(new FormControl(['abc']))).toBeNull();
      expect(maxItemLength(3)(new FormControl(null))).toBeNull();
    });
  });

  describe('uniqueTitle', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('reports a taken title after a pause in typing', async () => {
      const isTaken = vi.fn(() => of(true));
      const control = new FormControl('Write docs', { asyncValidators: uniqueTitle(isTaken) });
      expect(control.pending).toBe(true);

      await vi.advanceTimersByTimeAsync(300);

      expect(isTaken).toHaveBeenCalledWith('Write docs');
      expect(control.errors).toEqual({ titleTaken: 'A task with this title already exists.' });
    });

    it('only checks the latest value', async () => {
      const isTaken = vi.fn(() => of(false));
      const control = new FormControl('Wri', { asyncValidators: uniqueTitle(isTaken) });

      await vi.advanceTimersByTimeAsync(100);
      control.setValue('Write docs');
      await vi.advanceTimersByTimeAsync(300);

      expect(isTaken).toHaveBeenCalledTimes(1);
      expect(isTaken).toHaveBeenCalledWith('Write docs');
      expect(control.valid).toBe(true);
    });

    it('skips empty titles and never blocks saving when the check fails', async () => {
      const failing = new FormControl('Write docs', {
        asyncValidators: uniqueTitle(() => throwError(() => new Error('down'))),
      });
      const empty = new FormControl('  ', { asyncValidators: uniqueTitle(() => NEVER) });

      await vi.advanceTimersByTimeAsync(300);

      expect(failing.valid).toBe(true);
      expect(empty.pending).toBe(false);
    });
  });
});
