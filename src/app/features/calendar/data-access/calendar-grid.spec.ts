import { buildTask } from '../../../../testing/builders';
import { monthGrid, periodLabel, shiftDate, weekDays, weekdayLabels } from './calendar-grid';

/** Intl puts thin and no-break spaces around the range dash. */
const plain = (text: string | null) => text?.replace(/\s/g, ' ');

describe('calendar grid', () => {
  const today = '2026-10-22';

  describe('monthGrid', () => {
    it('covers the month in whole weeks starting on Monday', () => {
      const weeks = monthGrid('2026-10-15', [], today);

      expect(weeks).toHaveLength(5);
      expect(weeks.every((week) => week.length === 7)).toBe(true);
      expect(weeks[0]?.[0]).toMatchObject({ date: '2026-09-28', dayOfMonth: 28, inMonth: false });
      expect(weeks[0]?.[3]).toMatchObject({ date: '2026-10-01', inMonth: true });
      expect(weeks[4]?.[6]).toMatchObject({ date: '2026-11-01', inMonth: false });
    });

    it('uses six weeks when the month needs them', () => {
      expect(monthGrid('2026-08-01', [], today)).toHaveLength(6);
    });

    it('marks today and past days', () => {
      const days = monthGrid('2026-10-01', [], today).flat();

      expect(days.find((day) => day.isToday)?.date).toBe(today);
      expect(days.find((day) => day.date === '2026-10-21')?.isPast).toBe(true);
      expect(days.find((day) => day.date === today)?.isPast).toBe(false);
    });

    it('puts each task on its due date, open ones first by priority', () => {
      const days = monthGrid(
        '2026-10-01',
        [
          buildTask({ id: 'done', dueDate: today, status: 'done', priority: 'high' }),
          buildTask({ id: 'low', dueDate: today, priority: 'low' }),
          buildTask({ id: 'high', dueDate: today, priority: 'high' }),
          buildTask({ id: 'other', dueDate: '2026-10-23' }),
        ],
        today,
      ).flat();

      const due = (date: string) => days.find((day) => day.date === date)?.tasks.map((t) => t.id);
      expect(due(today)).toEqual(['high', 'low', 'done']);
      expect(due('2026-10-23')).toEqual(['other']);
    });
  });

  describe('weekDays', () => {
    it('gives the seven days from Monday, all in range', () => {
      const days = weekDays(today, [buildTask({ id: 'a', dueDate: '2026-10-25' })], today);

      expect(days.map((day) => day.date)).toEqual([
        '2026-10-19',
        '2026-10-20',
        '2026-10-21',
        '2026-10-22',
        '2026-10-23',
        '2026-10-24',
        '2026-10-25',
      ]);
      expect(days.every((day) => day.inMonth)).toBe(true);
      expect(days[6]?.tasks.map((task) => task.id)).toEqual(['a']);
    });
  });

  it('moves by a month or a week, and not at all in the agenda', () => {
    expect(shiftDate('month', '2026-10-31', 1)).toBe('2026-11-30');
    expect(shiftDate('week', today, -1)).toBe('2026-10-15');
    expect(shiftDate('agenda', today, 1)).toBe(today);
  });

  it('names the period on screen', () => {
    expect(periodLabel('month', today, 'en')).toBe('October 2026');
    expect(plain(periodLabel('week', today, 'en'))).toBe('Oct 19 – 25, 2026');
    expect(plain(periodLabel('week', '2026-09-30', 'en'))).toBe('Sep 28 – Oct 4, 2026');
    expect(plain(periodLabel('week', '2026-12-30', 'en'))).toBe('Dec 28, 2026 – Jan 3, 2027');
    expect(periodLabel('agenda', today, 'en')).toBeNull();
    expect(periodLabel('month', today, 'ar-u-nu-latn')).toBe('أكتوبر 2026');
  });

  it('lists weekday names from Monday', () => {
    expect(weekdayLabels('en')).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });
});
