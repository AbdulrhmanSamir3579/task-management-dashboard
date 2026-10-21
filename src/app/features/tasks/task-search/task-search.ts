import {
  type Observable,
  type OperatorFunction,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import type { TaskDto } from '../../../core/models';

export interface TaskSearchState {
  /** The trimmed query the state belongs to, used to highlight matches. */
  query: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  results: TaskDto[];
}

export interface TaskSearchOptions {
  /** Pause in typing before a request is sent. */
  debounceMs: number;
  /** Shorter queries do not search. */
  minLength: number;
}

export const DEFAULT_TASK_SEARCH_OPTIONS: TaskSearchOptions = { debounceMs: 300, minLength: 2 };

/**
 * Turns raw input values into search states:
 * - trims, waits for a pause in typing and skips repeated queries, so the API is only
 *   called for queries that actually changed;
 * - ignores queries shorter than `minLength`;
 * - `switchMap` cancels the previous request when a new query arrives, so a slow, stale
 *   response can never replace newer results;
 * - errors become an `error` state instead of ending the stream, so the next query
 *   still searches.
 */
export function taskSearch(
  search: (query: string) => Observable<TaskDto[]>,
  options: Partial<TaskSearchOptions> = {},
): OperatorFunction<string, TaskSearchState> {
  const { debounceMs, minLength } = { ...DEFAULT_TASK_SEARCH_OPTIONS, ...options };

  return (queries) =>
    queries.pipe(
      map((query) => query.trim()),
      debounceTime(debounceMs),
      distinctUntilChanged(),
      switchMap((query) =>
        query.length < minLength
          ? of<TaskSearchState>({ query, status: 'idle', results: [] })
          : search(query).pipe(
              map((results): TaskSearchState => ({ query, status: 'success', results })),
              startWith<TaskSearchState>({ query, status: 'loading', results: [] }),
              catchError(() => of<TaskSearchState>({ query, status: 'error', results: [] })),
            ),
      ),
    );
}
