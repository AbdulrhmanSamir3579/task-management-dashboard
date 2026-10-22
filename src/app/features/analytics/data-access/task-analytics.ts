import {
  TASK_PRIORITIES,
  TASK_PRIORITY_KEYS,
  TASK_STATUSES,
  TASK_STATUS_KEYS,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '../../../core/models';
import type { Translate } from '../../../core/i18n/translate';
import type { ChartDatum, ChartSeries, ChartTone } from '../../../shared/charts/chart.models';
import { addDaysToIsoDate, fromIsoDate, toIsoDate } from '../../../shared/utils/date.utils';

/** Same colours as the board: blue to do, orange in progress, green done. */
const STATUS_TONES: Record<TaskStatus, ChartTone> = {
  todo: 'primary',
  in_progress: 'warning',
  done: 'success',
};

const PRIORITY_TONES: Record<TaskPriority, ChartTone> = {
  high: 'danger',
  medium: 'warning',
  low: 'success',
};

/** Categories and their series, ready for a bar or line chart. */
export interface CategorySeries {
  categories: string[];
  series: ChartSeries[];
}

const localDay = (timestamp: string): string => toIsoDate(new Date(timestamp));

export function tasksByStatus(tasks: readonly Task[], t: Translate): ChartDatum[] {
  return TASK_STATUSES.map((status) => ({
    label: t(TASK_STATUS_KEYS[status]),
    value: tasks.filter((task) => task.status === status).length,
    tone: STATUS_TONES[status],
  }));
}

export function tasksByPriority(tasks: readonly Task[], t: Translate): ChartDatum[] {
  return TASK_PRIORITIES.map((priority) => ({
    label: t(TASK_PRIORITY_KEYS[priority]),
    value: tasks.filter((task) => task.priority === priority).length,
    tone: PRIORITY_TONES[priority],
  }));
}

/** Each assignee's tasks split by status, busiest first. */
export function workloadByAssignee(tasks: readonly Task[], t: Translate): CategorySeries {
  const byPerson = new Map<string, { name: string; tasks: Task[] }>();
  for (const task of tasks) {
    const entry = byPerson.get(task.assignee.id) ?? { name: task.assignee.name, tasks: [] };
    entry.tasks.push(task);
    byPerson.set(task.assignee.id, entry);
  }
  const people = [...byPerson.values()].sort(
    (a, b) => b.tasks.length - a.tasks.length || a.name.localeCompare(b.name),
  );

  return {
    categories: people.map((person) => person.name),
    series: TASK_STATUSES.map((status) => ({
      name: t(TASK_STATUS_KEYS[status]),
      tone: STATUS_TONES[status],
      values: people.map((person) => person.tasks.filter((task) => task.status === status).length),
    })),
  };
}

/**
 * Tasks created and completed on each of the last `days` days, ending `today`
 * (`YYYY-MM-DD`). Day labels are formatted for `locale`.
 */
export function completionTrend(
  tasks: readonly Task[],
  today: string,
  t: Translate,
  locale: string,
  days = 14,
): CategorySeries {
  const dayLabel = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });
  const dates = Array.from({ length: days }, (_, index) =>
    addDaysToIsoDate(today, index - days + 1),
  );
  const countPerDay = (timestamps: string[]): number[] => {
    const counts = new Map<string, number>();
    for (const timestamp of timestamps) {
      const day = localDay(timestamp);
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    return dates.map((date) => counts.get(date) ?? 0);
  };

  return {
    categories: dates.map((date) => dayLabel.format(fromIsoDate(date))),
    series: [
      {
        name: t('ANALYTICS.CREATED'),
        tone: 'primary',
        values: countPerDay(tasks.map((task) => task.createdAt)),
      },
      {
        name: t('ANALYTICS.COMPLETED'),
        tone: 'success',
        values: countPerDay(tasks.flatMap((task) => (task.completedAt ? [task.completedAt] : []))),
      },
    ],
  };
}
