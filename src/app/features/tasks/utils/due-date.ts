import type { Task } from '../../../core/models';
import { calendarDaysBetween, fromIsoDate } from '../../../shared/utils/date.utils';

export interface DueDateInfo {
  icon: string;
  label: string;
  tone: 'overdue' | 'soon' | 'upcoming' | 'done';
}

const days = (count: number): string => `${count} ${count === 1 ? 'day' : 'days'}`;

/** Short due date text for a card, relative to `today` (`YYYY-MM-DD`). */
export function describeDueDate(
  task: Pick<Task, 'status' | 'dueDate'>,
  today: string,
): DueDateInfo {
  if (task.status === 'done') {
    return { icon: '✅', label: 'Completed', tone: 'done' };
  }
  const remaining = calendarDaysBetween(fromIsoDate(today), fromIsoDate(task.dueDate));
  if (remaining < 0) {
    return { icon: '⚠️', label: `Overdue by ${days(-remaining)}`, tone: 'overdue' };
  }
  if (remaining === 0) {
    return { icon: '📅', label: 'Due today', tone: 'soon' };
  }
  if (remaining === 1) {
    return { icon: '📅', label: 'Due tomorrow', tone: 'soon' };
  }
  return { icon: '📅', label: `Due in ${days(remaining)}`, tone: 'upcoming' };
}
