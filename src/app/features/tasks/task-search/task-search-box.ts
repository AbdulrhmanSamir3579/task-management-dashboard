import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Subject, filter, map, of } from 'rxjs';
import { LanguageService } from '../../../core/i18n/language.service';
import type { TranslationKey } from '../../../core/i18n/translation-key';
import { HighlightPipe } from '../../../shared/pipes/highlight.pipe';
import { UiAutocomplete, UiAutocompleteItem } from '../../../shared/ui/autocomplete/autocomplete';
import { rankByText } from '../../../shared/utils/text-search';
import { TasksApi } from '../data-access/tasks.api';
import { TasksStore } from '../data-access/tasks.store';
import {
  DEFAULT_TASK_SEARCH_OPTIONS,
  type TaskSearchOptions,
  type TaskSearchState,
  type TaskSuggestion,
  taskSearch,
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
 *   request and no delay. Until then (or if loading failed) it asks the API, debounced,
 *   with stale requests cancelled.
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
  private readonly queries = new Subject<string>();

  private readonly onTasksPage = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => isTasksUrl(this.router.url)),
    ),
    { initialValue: isTasksUrl(this.router.url) },
  );

  protected readonly text = signal<TaskSuggestion | string | null>(null);
  protected readonly state = signal<TaskSearchState>({ query: '', status: 'idle', results: [] });
  protected readonly emptyMessage = computed(() =>
    this.language.t(EMPTY_MESSAGES[this.state().status]),
  );

  constructor() {
    this.queries
      .pipe(
        taskSearch(
          (query) =>
            this.store.hasLoaded() ? of(this.searchLoaded(query)) : this.searchApi(query),
          {
            minLength: this.options.minLength,
            debounceMs: () => (this.store.hasLoaded() ? 0 : this.remoteDelay()),
          },
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.state.set(state));

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
    this.queries.next(query);
    if (this.onTasksPage()) {
      this.store.setFilters({ search: query.trim() });
    }
  }

  protected open(task: TaskSuggestion): void {
    void this.router.navigate(['/tasks'], { queryParams: { q: task.title } });
  }

  protected search(text: string): void {
    const query = text.trim();
    void this.router.navigate(['/tasks'], {
      queryParams: { q: query || null },
      queryParamsHandling: this.onTasksPage() ? 'merge' : undefined,
    });
  }

  private searchLoaded(query: string): TaskSuggestion[] {
    return rankByText(this.store.entities(), query)
      .slice(0, SEARCH_SUGGESTION_LIMIT)
      .map(({ id, title, description }) => ({ id, title, description }));
  }

  private searchApi(query: string) {
    return this.api.search(query, SEARCH_SUGGESTION_LIMIT).pipe(
      map((tasks) =>
        tasks.map(({ id, title, description }) => ({
          id,
          title,
          description: description ?? '',
        })),
      ),
    );
  }

  private remoteDelay(): number {
    const { debounceMs } = this.options;
    return typeof debounceMs === 'function' ? debounceMs() : debounceMs;
  }

  private textOf(value: TaskSuggestion | string | null): string {
    return typeof value === 'string' ? value : (value?.title ?? '');
  }
}
