import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  computed,
  debounced,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { LanguageService } from '../../../core/i18n/language.service';
import type { TranslationKey } from '../../../core/i18n/translation-key';
import { HighlightPipe } from '../../../shared/pipes/highlight.pipe';
import { UiAutocomplete, UiAutocompleteItem } from '../../../shared/ui/autocomplete/autocomplete';
import { submittableWait } from '../../../shared/utils/submittable-wait';
import { rankByText } from '../../../shared/utils/text-search';
import { TasksApi } from '../data-access/tasks.api';
import { TasksStore } from '../data-access/tasks.store';
import {
  DEFAULT_TASK_SEARCH_OPTIONS,
  type TaskSearchOptions,
  type TaskSearchState,
  type TaskSuggestion,
  toSuggestion,
} from './task-search';

/** Overrides for the search timing, e.g. no debounce in tests. */
export const TASK_SEARCH_OPTIONS = new InjectionToken<Partial<TaskSearchOptions>>(
  'TASK_SEARCH_OPTIONS',
  { providedIn: 'root', factory: () => ({}) },
);

export const SEARCH_SUGGESTION_LIMIT = 6;

const EMPTY_MESSAGES: Record<TaskSearchState['status'], TranslationKey> = {
  idle: 'SEARCH.MIN_CHARS',
  loading: 'SEARCH.SEARCHING',
  success: 'SEARCH.NO_RESULTS',
  error: 'SEARCH.UNAVAILABLE',
};

const isTasksUrl = (url: string): boolean => url.split(/[?#]/)[0] === '/tasks';

/**
 * Header search with live suggestions.
 * - Local first: once the tasks are loaded, suggestions come from them at once, with no
 *   request and no delay. Until then (or if loading failed) it asks the API through an
 *   `httpResource`, which cancels the request for an outdated query.
 * - The API search waits for a pause in typing with Angular's `debounced()`; Enter ends
 *   the wait at once.
 * - On the Tasks page the board itself is filtered on every keystroke; the page keeps
 *   `?q=` in step with it.
 * - A suggestion or Enter opens the Tasks page filtered by the text. Enter on the Tasks
 *   page keeps the other filters.
 */
@Component({
  selector: 'app-task-search-box',
  imports: [UiAutocomplete, UiAutocompleteItem, HighlightPipe, TranslatePipe],
  templateUrl: './task-search-box.html',
  styleUrl: './task-search-box.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskSearchBox {
  private readonly api = inject(TasksApi);
  private readonly store = inject(TasksStore);
  private readonly language = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly options = { ...DEFAULT_TASK_SEARCH_OPTIONS, ...inject(TASK_SEARCH_OPTIONS) };

  private readonly onTasksPage = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => isTasksUrl(this.router.url)),
    ),
    { initialValue: isTasksUrl(this.router.url) },
  );

  /** The trimmed text, on every keystroke. */
  private readonly query = signal('');
  private readonly pause = submittableWait<string>(() =>
    this.store.hasLoaded() ? 0 : this.options.debounceMs,
  );
  /** The query once typing pauses, or at once on Enter or over loaded tasks. */
  private readonly settledQuery = debounced(() => this.query(), this.pause.wait);
  private readonly remote = this.api.searchResource(() => {
    const query = this.settledQuery.value();
    return !this.store.hasLoaded() && query.length >= this.options.minLength ? query : undefined;
  }, SEARCH_SUGGESTION_LIMIT);

  protected readonly text = signal<TaskSuggestion | string | null>(null);
  protected readonly state = computed<TaskSearchState>(() => {
    const query = this.settledQuery.value();
    if (query.length < this.options.minLength) {
      return { query, status: 'idle', results: [] };
    }
    if (this.store.hasLoaded()) {
      return { query, status: 'success', results: this.searchLoaded(query) };
    }
    if (this.remote.status() === 'error') {
      return { query, status: 'error', results: [] };
    }
    const response = this.remote.isLoading() ? undefined : this.remote.value();
    return response
      ? { query, status: 'success', results: response.tasks.map(toSuggestion) }
      : { query, status: 'loading', results: [] };
  });
  protected readonly emptyMessage = computed(() =>
    this.language.t(EMPTY_MESSAGES[this.state().status]),
  );

  constructor() {
    // A search cleared or changed elsewhere on the Tasks page (chip, Clear filters, link)
    // is reflected in the box.
    effect(() => {
      const search = this.store.filters().search;
      if (this.onTasksPage() && untracked(() => this.textOf(this.text()).trim()) !== search) {
        this.text.set(search);
      }
    });
  }

  protected onQuery(query: string): void {
    this.query.set(query.trim());
    if (this.onTasksPage()) {
      this.store.setFilters({ search: query.trim() });
    }
  }

  protected open(task: TaskSuggestion): void {
    void this.router.navigate(['/tasks'], { queryParams: { q: task.title } });
  }

  protected search(text: string): void {
    const query = text.trim();
    this.pause.submit(query);
    this.query.set(query);
    void this.router.navigate(['/tasks'], {
      queryParams: { q: query || null },
      queryParamsHandling: this.onTasksPage() ? 'merge' : undefined,
    });
  }

  private searchLoaded(query: string): TaskSuggestion[] {
    return rankByText(this.store.entities(), query)
      .slice(0, SEARCH_SUGGESTION_LIMIT)
      .map(toSuggestion);
  }

  private textOf(value: TaskSuggestion | string | null): string {
    return typeof value === 'string' ? value : (value?.title ?? '');
  }
}
