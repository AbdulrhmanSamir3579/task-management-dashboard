import type { TranslationKey } from '../../../core/i18n/translation-key';
import { TASK_PRIORITIES, type Task } from '../../../core/models';
import { addDaysToIsoDate } from '../../../shared/utils/date.utils';

export type AgendaGroupId = 'overdue' | 'today' | 'week' | 'later';

export interface AgendaGroup {
  id: AgendaGroupId;
  title: TranslationKey;
  tasks: Task[];
}

const GROUPS: readonly { id: AgendaGroupId; title: TranslationKey }[] = [
  { id: 'overdue', title: 'CALENDAR.GROUP.OVERDUE' },
  { id: 'today', title: 'CALENDAR.GROUP.TODAY' },
  { id: 'week', title: 'CALENDAR.GROUP.WEEK' },
  { id: 'later', title: 'CALENDAR.GROUP.LATER' },
];

const byDueDate = (a: Task, b: Task): number =>
  a.dueDate.localeCompare(b.dueDate) ||
  TASK_PRIORITIES.indexOf(a.priority) - TASK_PRIORITIES.indexOf(b.priority) ||
  a.title.localeCompare(b.title);

/**
 * Open tasks grouped by when they are due, relative to `today` (`YYYY-MM-DD`). Each group
 * is ordered by due date, then priority; empty groups are left out.
 */
export function buildAgenda(tasks: readonly Task[], today: string): AgendaGroup[] {
  const weekEnd = addDaysToIsoDate(today, 7);
  const groupOf = (task: Task): AgendaGroupId => {
    if (task.dueDate < today) {
      return 'overdue';
    }
    if (task.dueDate === today) {
      return 'today';
    }
    return task.dueDate <= weekEnd ? 'week' : 'later';
  };

  const open = tasks.filter((task) => task.status !== 'done').sort(byDueDate);
  return GROUPS.map((group) => ({
    ...group,
    tasks: open.filter((task) => groupOf(task) === group.id),
  })).filter((group) => group.tasks.length > 0);
}
