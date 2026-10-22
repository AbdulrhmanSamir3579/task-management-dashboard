import {
  addDaysToIsoDate,
  addMonthsToIsoDate,
  calendarDaysBetween,
  fromIsoDate,
  isIsoDate,
  startOfMonth,
  startOfWeek,
  toIsoDate,
} from './date.utils';

describe('date utils', () => {
  describe('toIsoDate', () => {
    it('formats a local date with zero padding', () => {
      expect(toIsoDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
    });
  });

  describe('fromIsoDate', () => {
    it('parses a calendar day as local midnight', () => {
      expect(fromIsoDate('2026-10-23')).toEqual(new Date(2026, 9, 23));
    });
  });

  describe('addDaysToIsoDate', () => {
    it('moves forward across month and year boundaries', () => {
      expect(addDaysToIsoDate('2026-12-30', 3)).toBe('2027-01-02');
    });

    it('moves backwards with negative values', () => {
      expect(addDaysToIsoDate('2026-03-01', -1)).toBe('2026-02-28');
    });
  });

  describe('addMonthsToIsoDate', () => {
    it('moves by whole months across years', () => {
      expect(addMonthsToIsoDate('2026-11-15', 2)).toBe('2027-01-15');
      expect(addMonthsToIsoDate('2026-01-15', -1)).toBe('2025-12-15');
    });

    it('keeps the day inside shorter months', () => {
      expect(addMonthsToIsoDate('2026-01-31', 1)).toBe('2026-02-28');
      expect(addMonthsToIsoDate('2028-03-31', -1)).toBe('2028-02-29');
    });
  });

  describe('startOfMonth', () => {
    it('gives the first day of the month', () => {
      expect(startOfMonth('2026-10-22')).toBe('2026-10-01');
    });
  });

  describe('startOfWeek', () => {
    it('goes back to Monday by default', () => {
      expect(startOfWeek('2026-10-22')).toBe('2026-10-19');
      expect(startOfWeek('2026-10-19')).toBe('2026-10-19');
      expect(startOfWeek('2026-10-25')).toBe('2026-10-19');
    });

    it('can start weeks on Sunday', () => {
      expect(startOfWeek('2026-10-22', 0)).toBe('2026-10-18');
    });
  });

  describe('isIsoDate', () => {
    it('accepts real days only', () => {
      expect(isIsoDate('2026-10-22')).toBe(true);
      expect(isIsoDate('2026-02-30')).toBe(false);
      expect(isIsoDate('22/10/2026')).toBe(false);
      expect(isIsoDate('')).toBe(false);
      expect(isIsoDate(null)).toBe(false);
    });
  });

  describe('calendarDaysBetween', () => {
    it('ignores the time of day', () => {
      const from = new Date(2026, 9, 21, 23, 59);
      const to = new Date(2026, 9, 22, 0, 1);
      expect(calendarDaysBetween(from, to)).toBe(1);
    });

    it('is negative when the target is in the past', () => {
      expect(calendarDaysBetween(new Date(2026, 9, 21), new Date(2026, 9, 18))).toBe(-3);
    });

    it('is zero for the same day', () => {
      expect(calendarDaysBetween(new Date(2026, 9, 21, 8), new Date(2026, 9, 21, 20))).toBe(0);
    });
  });
});
