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
  /** Pause in typing before an API search. Searches over loaded tasks never wait. */
  debounceMs: number;
  /** Shorter queries do not search. */
  minLength: number;
}

export const DEFAULT_TASK_SEARCH_OPTIONS: TaskSearchOptions = { debounceMs: 300, minLength: 2 };

export function toSuggestion({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description?: string | null;
}): TaskSuggestion {
  return { id, title, description: description ?? '' };
}
