import type { Task, TaskPriority, TaskStatus } from '../../../core/models';

export interface TaskFilters {
  /** Matched against title and description, case-insensitive. */
  search: string;
  /** Empty means every status. */
  statuses: TaskStatus[];
  /** Empty means every priority. */
  priorities: TaskPriority[];
  assigneeId: string | null;
}

export const EMPTY_TASK_FILTERS: TaskFilters = {
  search: '',
  statuses: [],
  priorities: [],
  assigneeId: null,
};

export type TaskColumns = Record<TaskStatus, Task[]>;

export function filterTasks(tasks: readonly Task[], filters: TaskFilters): Task[] {
  const search = filters.search.trim().toLowerCase();
  return tasks.filter(
    (task) =>
      (!search ||
        task.title.toLowerCase().includes(search) ||
        task.description.toLowerCase().includes(search)) &&
      (filters.statuses.length === 0 || filters.statuses.includes(task.status)) &&
      (filters.priorities.length === 0 || filters.priorities.includes(task.priority)) &&
      (!filters.assigneeId || task.assignee.id === filters.assigneeId),
  );
}

export function hasActiveFilters(filters: TaskFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.statuses.length > 0 ||
    filters.priorities.length > 0 ||
    filters.assigneeId !== null
  );
}

/** Board columns, each ordered by the task's position in it. */
export function groupByStatus(tasks: readonly Task[]): TaskColumns {
  const columns: TaskColumns = { todo: [], in_progress: [], done: [] };
  for (const task of tasks) {
    columns[task.status].push(task);
  }
  for (const column of Object.values(columns)) {
    column.sort((a, b) => a.position - b.position);
  }
  return columns;
}
