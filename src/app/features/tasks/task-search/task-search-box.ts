import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import type { TaskDto } from '../../../core/models';
import { HighlightPipe } from '../../../shared/pipes/highlight.pipe';
import { UiAutocomplete, UiAutocompleteItem } from '../../../shared/ui/autocomplete/autocomplete';
import { TasksApi } from '../data-access/tasks.api';
import { type TaskSearchOptions, type TaskSearchState, taskSearch } from './task-search';

/** Overrides for the search timing, e.g. no debounce in tests. */
export const TASK_SEARCH_OPTIONS = new InjectionToken<Partial<TaskSearchOptions>>(
  'TASK_SEARCH_OPTIONS',
  { providedIn: 'root', factory: () => ({}) },
);

export const SEARCH_SUGGESTION_LIMIT = 6;

const EMPTY_MESSAGES: Record<TaskSearchState['status'], string> = {
  idle: 'Type at least 2 characters',
  loading: 'Searching…',
  success: 'No tasks found',
  error: 'Search is unavailable right now. Please try again.',
};

/** Header search with live suggestions; Enter or a suggestion opens the filtered board. */
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
  private readonly router = inject(Router);
  private readonly queries = new Subject<string>();

  protected readonly state = signal<TaskSearchState>({ query: '', status: 'idle', results: [] });
  protected readonly emptyMessage = computed(() => EMPTY_MESSAGES[this.state().status]);

  constructor() {
    this.queries
      .pipe(
        taskSearch(
          (query) => this.api.search(query, SEARCH_SUGGESTION_LIMIT),
          inject(TASK_SEARCH_OPTIONS),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.state.set(state));
  }

  protected onQuery(query: string): void {
    this.queries.next(query);
  }

  protected open(task: TaskDto): void {
    void this.router.navigate(['/tasks'], { queryParams: { q: task.title } });
  }

  protected search(text: string): void {
    const query = text.trim();
    void this.router.navigate(['/tasks'], { queryParams: { q: query || null } });
  }
}
