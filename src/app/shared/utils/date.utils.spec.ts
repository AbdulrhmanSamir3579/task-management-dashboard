import { addDaysToIsoDate, calendarDaysBetween, toIsoDate } from './date.utils';

describe('date utils', () => {
  describe('toIsoDate', () => {
    it('formats a local date with zero padding', () => {
      expect(toIsoDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
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
