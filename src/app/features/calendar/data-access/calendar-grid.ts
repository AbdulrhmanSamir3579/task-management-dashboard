import { TASK_PRIORITIES, type Task } from '../../../core/models';
import {
  addDaysToIsoDate,
  addMonthsToIsoDate,
  calendarDaysBetween,
  fromIsoDate,
  startOfMonth,
  startOfWeek,
} from '../../../shared/utils/date.utils';

export type CalendarView = 'month' | 'week' | 'agenda';

export const CALENDAR_VIEWS: readonly CalendarView[] = ['month', 'week', 'agenda'];

/** Weeks start on Monday (ISO 8601). */
export const WEEK_STARTS_ON = 1;

/** One day cell of the month or week view. */
export interface CalendarDay {
  /** `YYYY-MM-DD`. */
  date: string;
  dayOfMonth: number;
  /** False for the days of the previous and next month that fill the month grid. */
  inMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  /** Tasks due that day: open ones first by priority, then done ones. */
  tasks: Task[];
}

const byImportance = (a: Task, b: Task): number =>
  Number(a.status === 'done') - Number(b.status === 'done') ||
  TASK_PRIORITIES.indexOf(a.priority) - TASK_PRIORITIES.indexOf(b.priority) ||
  a.title.localeCompare(b.title);

function tasksByDueDate(tasks: readonly Task[]): Map<string, Task[]> {
  const byDate = new Map<string, Task[]>();
  for (const task of [...tasks].sort(byImportance)) {
    byDate.set(task.dueDate, [...(byDate.get(task.dueDate) ?? []), task]);
  }
  return byDate;
}

function days(
  first: string,
  count: number,
  tasks: readonly Task[],
  today: string,
  month: string | null,
): CalendarDay[] {
  const byDate = tasksByDueDate(tasks);
  return Array.from({ length: count }, (_, index) => {
    const date = addDaysToIsoDate(first, index);
    return {
      date,
      dayOfMonth: fromIsoDate(date).getDate(),
      inMonth: month === null || date.startsWith(month),
      isToday: date === today,
      isPast: date < today,
      tasks: byDate.get(date) ?? [],
    };
  });
}

/** The weeks that cover the month of `date`, each with seven days. */
export function monthGrid(date: string, tasks: readonly Task[], today: string): CalendarDay[][] {
  const first = startOfMonth(date);
  const gridStart = startOfWeek(first, WEEK_STARTS_ON);
  const last = addDaysToIsoDate(addMonthsToIsoDate(first, 1), -1);
  const weekCount = Math.ceil(
    (calendarDaysBetween(fromIsoDate(gridStart), fromIsoDate(last)) + 1) / 7,
  );
  const cells = days(gridStart, weekCount * 7, tasks, today, first.slice(0, 7));
  return Array.from({ length: weekCount }, (_, week) => cells.slice(week * 7, week * 7 + 7));
}

/** The seven days of the week of `date`. */
export function weekDays(date: string, tasks: readonly Task[], today: string): CalendarDay[] {
  return days(startOfWeek(date, WEEK_STARTS_ON), 7, tasks, today, null);
}

/** The date one period before (`-1`) or after (`1`) `date` in the given view. */
export function shiftDate(view: CalendarView, date: string, step: -1 | 1): string {
  if (view === 'month') {
    return addMonthsToIsoDate(date, step);
  }
  return view === 'week' ? addDaysToIsoDate(date, step * 7) : date;
}

const monthTitle = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' });
const weekRange = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const weekdayName = new Intl.DateTimeFormat('en', { weekday: 'short' });

/** Title of the period on screen: "October 2026" or "Oct 19 – 25, 2026". */
export function periodLabel(view: CalendarView, date: string): string {
  if (view === 'month') {
    return monthTitle.format(fromIsoDate(date));
  }
  if (view === 'week') {
    const start = startOfWeek(date, WEEK_STARTS_ON);
    return weekRange.formatRange(fromIsoDate(start), fromIsoDate(addDaysToIsoDate(start, 6)));
  }
  return 'Open tasks by due date';
}

/** Short weekday names in grid order, e.g. Mon … Sun. */
export function weekdayLabels(): string[] {
  // 2024-01-01 was a Monday.
  return Array.from({ length: 7 }, (_, index) =>
    weekdayName.format(fromIsoDate(addDaysToIsoDate('2024-01-01', index + WEEK_STARTS_ON - 1))),
  );
}
