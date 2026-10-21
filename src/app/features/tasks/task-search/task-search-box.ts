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
import { Subject, debounceTime, distinctUntilChanged, filter, map, of } from 'rxjs';
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

/** Delay before `?q=` follows the live filter, so typing does not flood the history. */
export const URL_SYNC_DELAY_MS = 300;

const EMPTY_MESSAGES: Record<TaskSearchState['status'], string> = {
  idle: 'Type at least 2 characters',
  loading: 'Searching…',
  success: 'No tasks found',
  error: 'Search is unavailable right now. Please try again.',
};

const isTasksUrl = (url: string): boolean => url.split(/[?#]/)[0] === '/tasks';

/**
 * Header search with live suggestions.
 * - Local first: once the tasks are loaded, suggestions come from them at once, with no
 *   request and no delay. Until then (or if loading failed) it asks the API, debounced,
 *   with stale requests cancelled.
 * - On the Tasks page the board itself is filtered on every keystroke, and `?q=` follows
 *   in the address bar.
 * - A suggestion or Enter opens the Tasks page filtered by the text.
 */
@Component({
  selector: 'app-task-search-box',
  imports: [UiAutocomplete, UiAutocompleteItem, HighlightPipe],
  template: `
    <form role="search" (submit)="$event.preventDefault()">
      <label for="global-search" class="visually-hidden">Search tasks</label>
      <ui-autocomplete
        inputId="global-search"
        placeholder="🔍 Search tasks..."
        optionLabel="title"
        [suggestions]="state().results"
        [emptyMessage]="emptyMessage()"
        [(value)]="text"
        (queryChange)="onQuery($event)"
        (selected)="open($event)"
        (submitted)="search($event)"
      >
        <ng-template uiAutocompleteItem [uiAutocompleteItemOf]="state().results" let-task>
          <span class="suggestion">
            <span class="suggestion__title">
              @for (part of task.title | highlight: state().query; track $index) {
                @if (part.match) {
                  <mark>{{ part.text }}</mark>
                } @else {
                  {{ part.text }}
                }
              }
            </span>
            @if (task.description) {
              <span class="suggestion__description">
                @for (part of task.description | highlight: state().query; track $index) {
                  @if (part.match) {
                    <mark>{{ part.text }}</mark>
                  } @else {
                    {{ part.text }}
                  }
                }
              </span>
            }
          </span>
        </ng-template>
      </ui-autocomplete>
    </form>
  `,
  styleUrl: './task-search-box.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskSearchBox {
  private readonly api = inject(TasksApi);
  private readonly store = inject(TasksStore);
  private readonly router = inject(Router);
  private readonly options = { ...DEFAULT_TASK_SEARCH_OPTIONS, ...inject(TASK_SEARCH_OPTIONS) };
  private readonly queries = new Subject<string>();
  private readonly urlQueries = new Subject<string>();

  private readonly onTasksPage = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => isTasksUrl(this.router.url)),
    ),
    { initialValue: isTasksUrl(this.router.url) },
  );

  protected readonly text = signal<TaskSuggestion | string | null>(null);
  protected readonly state = signal<TaskSearchState>({ query: '', status: 'idle', results: [] });
  protected readonly emptyMessage = computed(() => EMPTY_MESSAGES[this.state().status]);

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

    this.urlQueries
      .pipe(debounceTime(URL_SYNC_DELAY_MS), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((query) => {
        void this.router.navigate([], {
          queryParams: { q: query || null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });

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
      const search = query.trim();
      this.store.setFilters({ search });
      this.urlQueries.next(search);
    }
  }

  protected open(task: TaskSuggestion): void {
    void this.router.navigate(['/tasks'], { queryParams: { q: task.title } });
  }

  protected search(text: string): void {
    const query = text.trim();
    void this.router.navigate(['/tasks'], { queryParams: { q: query || null } });
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
