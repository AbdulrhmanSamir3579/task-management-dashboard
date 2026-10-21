import type { Activity, TaskDto, TaskStatus, TasksResponse, User } from '../models';
import { addDaysToIsoDate, calendarDaysBetween } from '../../shared/utils/date.utils';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const byPosition = (a: TaskDto, b: TaskDto): number => (a.position ?? 0) - (b.position ?? 0);

/** Positions 0..n-1 for the tasks of one column, keyed by task id. */
function renumber(column: readonly TaskDto[]): Map<string, TaskDto> {
  return new Map(column.map((task, position) => [task.id, { ...task, position }]));
}

export interface MockDb {
  tasks: TaskDto[];
  users: User[];
  activities: Activity[];
}

/**
 * The seed file is generated once, but the demo can be opened days later.
 * Every date is moved forward by the days elapsed since generation, so "overdue"
 * and "due today" keep their meaning.
 */
export function rebaseTasks(tasks: readonly TaskDto[], generatedAt: Date, now: Date): TaskDto[] {
  const offsetDays = calendarDaysBetween(generatedAt, now);
  const shift = (timestamp: string): string =>
    new Date(new Date(timestamp).getTime() + offsetDays * MS_PER_DAY).toISOString();

  return tasks.map((task) => ({
    ...task,
    dueDate: addDaysToIsoDate(task.dueDate, offsetDays),
    createdAt: shift(task.createdAt),
    updatedAt: shift(task.updatedAt),
    completedAt: task.completedAt ? shift(task.completedAt) : null,
  }));
}

/** Gives every task its index inside its status column, keeping the seed order. */
export function assignPositions(tasks: readonly TaskDto[]): TaskDto[] {
  const nextPosition = new Map<string, number>();
  return tasks.map((task) => {
    const position = nextPosition.get(task.status) ?? 0;
    nextPosition.set(task.status, position + 1);
    return { ...task, position };
  });
}

/** Unique assignees, sorted by name. */
export function extractUsers(tasks: readonly TaskDto[]): User[] {
  const users = new Map(tasks.map((task) => [task.assignee.id, task.assignee]));
  return [...users.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Rebuilds a plausible history from the task timestamps, newest first. */
export function seedActivities(tasks: readonly TaskDto[]): Activity[] {
  const entries: Omit<Activity, 'id'>[] = tasks.flatMap((task) => {
    const base = { taskId: task.id, taskTitle: task.title, actor: task.assignee.name };
    const created: Omit<Activity, 'id'> = { ...base, type: 'created', timestamp: task.createdAt };

    if (task.status === 'done' && task.completedAt) {
      return [
        created,
        { ...base, type: 'status_changed', toStatus: 'done', timestamp: task.completedAt },
      ];
    }
    if (task.updatedAt > task.createdAt) {
      return [created, { ...base, type: 'updated', timestamp: task.updatedAt }];
    }
    return [created];
  });

  return entries
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .map((entry, index) => ({ ...entry, id: `activity-${index + 1}` }));
}

export function createMockDb(seed: TasksResponse, now: Date): MockDb {
  const tasks = assignPositions(rebaseTasks(seed.tasks, new Date(seed.meta.lastUpdated), now));
  return {
    tasks,
    users: extractUsers(tasks),
    activities: seedActivities(tasks),
  };
}

/** Next sequential id, e.g. `task-018` after `task-017`. */
export function nextTaskId(tasks: readonly TaskDto[]): string {
  const highest = Math.max(0, ...tasks.map((task) => Number(task.id.replace(/\D/g, '')) || 0));
  return `task-${String(highest + 1).padStart(3, '0')}`;
}

/**
 * Moves a task to `status` at `position` (end of the column when omitted) and renumbers
 * the columns it left and entered, the way a board backend keeps ordering consistent.
 */
export function moveTask(
  tasks: readonly TaskDto[],
  taskId: string,
  status: TaskStatus,
  position?: number,
): TaskDto[] {
  const moving = tasks.find((task) => task.id === taskId);
  if (!moving) {
    return [...tasks];
  }

  const target = tasks
    .filter((task) => task.status === status && task.id !== taskId)
    .sort(byPosition);
  const index = Math.min(Math.max(position ?? target.length, 0), target.length);
  target.splice(index, 0, { ...moving, status });

  const source =
    moving.status === status
      ? []
      : tasks
          .filter((task) => task.status === moving.status && task.id !== taskId)
          .sort(byPosition);

  const updates = new Map([...renumber(source), ...renumber(target)]);
  return tasks.map((task) => updates.get(task.id) ?? task);
}

/** Removes a task and closes the gap it leaves in its column. */
export function removeTask(tasks: readonly TaskDto[], taskId: string): TaskDto[] {
  const removed = tasks.find((task) => task.id === taskId);
  const remaining = tasks.filter((task) => task.id !== taskId);
  if (!removed) {
    return remaining;
  }

  const updates = renumber(
    remaining.filter((task) => task.status === removed.status).sort(byPosition),
  );
  return remaining.map((task) => updates.get(task.id) ?? task);
}
