import {
  type Observable,
  type OperatorFunction,
  catchError,
  debounce,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
  timer,
} from 'rxjs';

/** What a suggestion needs, whether it comes from loaded tasks or from the API. */
export interface TaskSuggestion {
  id: string;
  title: string;
  description: string;
}

export interface TaskSearchState {
  /** The trimmed query the state belongs to, used to highlight matches. */
  query: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  results: TaskSuggestion[];
}

export interface TaskSearchOptions {
  /**
   * Pause in typing before searching. A function is read for every keystroke, so the
   * delay can depend on the data source; 0 searches at once, without a timer.
   */
  debounceMs: number | (() => number);
  /** Shorter queries do not search. */
  minLength: number;
}

export const DEFAULT_TASK_SEARCH_OPTIONS: TaskSearchOptions = { debounceMs: 300, minLength: 2 };

/**
 * Turns raw input values into search states:
 * - trims, waits for a pause in typing and skips repeated queries, so a remote search
 *   only runs for queries that actually changed;
 * - ignores queries shorter than `minLength`;
 * - `switchMap` cancels the previous request when a new query arrives, so a slow, stale
 *   response can never replace newer results;
 * - errors become an `error` state instead of ending the stream, so the next query
 *   still searches.
 */
export function taskSearch(
  search: (query: string) => Observable<TaskSuggestion[]>,
  options: Partial<TaskSearchOptions> = {},
): OperatorFunction<string, TaskSearchState> {
  const { debounceMs, minLength } = { ...DEFAULT_TASK_SEARCH_OPTIONS, ...options };
  const delayFor = typeof debounceMs === 'function' ? debounceMs : () => debounceMs;

  return (queries) =>
    queries.pipe(
      map((query) => query.trim()),
      debounce(() => {
        const delay = delayFor();
        return delay > 0 ? timer(delay) : of(0);
      }),
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
