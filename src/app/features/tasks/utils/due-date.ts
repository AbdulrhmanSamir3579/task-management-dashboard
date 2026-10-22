import type { TextRef } from '../../../core/i18n/text-ref';
import type { Task } from '../../../core/models';
import { calendarDaysBetween, fromIsoDate } from '../../../shared/utils/date.utils';

export interface DueDateInfo {
  icon: string;
  text: TextRef;
  tone: 'overdue' | 'soon' | 'upcoming' | 'done';
}

/** Short due date text for a card, relative to `today` (`YYYY-MM-DD`). */
export function describeDueDate(
  task: Pick<Task, 'status' | 'dueDate'>,
  today: string,
): DueDateInfo {
  if (task.status === 'done') {
    return { icon: '✅', text: { key: 'DUE.COMPLETED' }, tone: 'done' };
  }
  const remaining = calendarDaysBetween(fromIsoDate(today), fromIsoDate(task.dueDate));
  if (remaining < 0) {
    return { icon: '⚠️', text: { plural: 'DUE.OVERDUE_BY', count: -remaining }, tone: 'overdue' };
  }
  if (remaining === 0) {
    return { icon: '📅', text: { key: 'DUE.TODAY' }, tone: 'soon' };
  }
  if (remaining === 1) {
    return { icon: '📅', text: { key: 'DUE.TOMORROW' }, tone: 'soon' };
  }
  return { icon: '📅', text: { plural: 'DUE.IN', count: remaining }, tone: 'upcoming' };
}
