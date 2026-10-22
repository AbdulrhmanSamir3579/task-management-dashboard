import { TASK_PRIORITIES, type Task } from '../../../core/models';
import { addDaysToIsoDate } from '../../../shared/utils/date.utils';

export type AgendaGroupId = 'overdue' | 'today' | 'week' | 'later';

export interface AgendaGroup {
  id: AgendaGroupId;
  title: string;
  tasks: Task[];
}

const GROUPS: readonly { id: AgendaGroupId; title: string }[] = [
  { id: 'overdue', title: 'Overdue' },
  { id: 'today', title: 'Today' },
  { id: 'week', title: 'Next 7 days' },
  { id: 'later', title: 'Later' },
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
