import { type ChangeType, type Statistic, type Task, isTaskOverdue } from '../../../core/models';
import { addDaysToIsoDate, toIsoDate } from '../../../shared/utils/date.utils';

const signed = (count: number): string => (count > 0 ? `+${count}` : '0');

const toneFor = (count: number, direction: 'good' | 'bad'): ChangeType =>
  count === 0 ? 'neutral' : direction === 'good' ? 'positive' : 'negative';

const localDay = (timestamp: string): string => toIsoDate(new Date(timestamp));

/**
 * Dashboard statistics computed from the tasks themselves, so they always agree with the
 * board. `today` is a `YYYY-MM-DD` date; "this week" means the last or next 7 days.
 */
export function computeTaskStats(tasks: readonly Task[], today: string): Statistic[] {
  const weekAgo = addDaysToIsoDate(today, -6);
  const weekAhead = addDaysToIsoDate(today, 6);
  const yesterday = addDaysToIsoDate(today, -1);

  const createdThisWeek = tasks.filter((task) => localDay(task.createdAt) >= weekAgo).length;
  const completed = tasks.filter((task) => task.status === 'done');
  const completedToday = completed.filter(
    (task) => task.completedAt !== null && localDay(task.completedAt) === today,
  ).length;
  const inProgress = tasks.filter((task) => task.status === 'in_progress');
  const dueThisWeek = inProgress.filter(
    (task) => task.dueDate >= today && task.dueDate <= weekAhead,
  ).length;
  const overdue = tasks.filter((task) => isTaskOverdue(task, today));
  // Tasks due yesterday are the ones that became overdue today.
  const overdueToday = overdue.filter((task) => task.dueDate === yesterday).length;

  return [
    {
      id: 'total',
      title: 'Total Tasks',
      icon: '📊',
      value: tasks.length,
      change: signed(createdThisWeek),
      changeLabel: 'this week',
      changeType: toneFor(createdThisWeek, 'good'),
      color: '#1976D2',
    },
    {
      id: 'completed',
      title: 'Completed',
      icon: '✅',
      value: completed.length,
      change: signed(completedToday),
      changeLabel: 'today',
      changeType: toneFor(completedToday, 'good'),
      color: '#388E3C',
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      icon: '🔄',
      value: inProgress.length,
      change: String(dueThisWeek),
      changeLabel: 'due this week',
      changeType: 'neutral',
      color: '#FF6F00',
    },
    {
      id: 'overdue',
      title: 'Overdue',
      icon: '⚠️',
      value: overdue.length,
      change: signed(overdueToday),
      changeLabel: 'today',
      changeType: toneFor(overdueToday, 'bad'),
      color: '#D32F2F',
    },
  ];
}
