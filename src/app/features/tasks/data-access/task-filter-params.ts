import { TASK_PRIORITIES, TASK_STATUSES } from '../../../core/models';
import type { TaskFilters } from './task-filters';

/** Board filters as Tasks page query params. `null` leaves the param out of the URL. */
export interface TaskFilterParams {
  q: string | null;
  /** Comma-separated, e.g. `todo,done`. */
  status: string | null;
  /** Comma-separated, e.g. `high,medium`. */
  priority: string | null;
  assignee: string | null;
}

export type RawTaskFilterParams = Partial<Record<keyof TaskFilterParams, string | null>>;

const list = (values: readonly string[]): string | null => values.join(',') || null;

/** Known values from a comma-separated param, in board order; unknown ones are dropped. */
function pick<T extends string>(param: string | null | undefined, known: readonly T[]): T[] {
  const values = new Set((param ?? '').split(','));
  return known.filter((value) => values.has(value));
}

export function filtersToParams(filters: TaskFilters): TaskFilterParams {
  return {
    q: filters.search.trim() || null,
    status: list(filters.statuses),
    priority: list(filters.priorities),
    assignee: filters.assigneeId,
  };
}

/** Reads filters from the URL; anything missing or invalid means "no filter". */
export function filtersFromParams(params: RawTaskFilterParams): TaskFilters {
  return {
    search: params.q?.trim() ?? '',
    statuses: pick(params.status, TASK_STATUSES),
    priorities: pick(params.priority, TASK_PRIORITIES),
    assigneeId: params.assignee?.trim() || null,
  };
}

export function sameParams(a: RawTaskFilterParams, b: RawTaskFilterParams): boolean {
  const keys: (keyof TaskFilterParams)[] = ['q', 'status', 'priority', 'assignee'];
  return keys.every((key) => (a[key] ?? null) === (b[key] ?? null));
}
