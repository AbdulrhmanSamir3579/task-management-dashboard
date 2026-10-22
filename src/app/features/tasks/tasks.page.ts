import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { debounceTime, filter, map } from 'rxjs';
import {
  type TaskFilterParams,
  filtersFromParams,
  filtersToParams,
  sameParams,
} from './data-access/task-filter-params';
import { TasksStore } from './data-access/tasks.store';
import { TaskBoardSection } from './task-board-section/task-board-section';

/** Delay before the URL follows the filters, so typing a search does not flood it. */
export const FILTER_URL_DELAY_MS = 300;

/**
 * The board with its filters kept in the URL (`?q=&status=&priority=&assignee=`), so a
 * filtered view survives a reload and can be shared. The URL is the source of truth when
 * it changes from outside (a link, the header search); filter changes on the page are
 * written back with `replaceUrl`, so they do not add history entries.
 */
@Component({
  selector: 'app-tasks-page',
  imports: [TaskBoardSection],
  template: `<app-task-board-section />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksPage {
  private readonly store = inject(TasksStore);
  private readonly router = inject(Router);

  // Query params, bound by the router.
  readonly q = input<string>();
  readonly status = input<string>();
  readonly priority = input<string>();
  readonly assignee = input<string>();

  private readonly urlParams = computed<TaskFilterParams>(() => ({
    q: this.q() ?? null,
    status: this.status() ?? null,
    priority: this.priority() ?? null,
    assignee: this.assignee() ?? null,
  }));

  /**
   * Params this page wrote last. When they come back from the router they are not a new
   * filter: the user may have typed more since, and that must not be undone.
   */
  private written: TaskFilterParams | null = null;

  constructor() {
    effect(() => {
      const params = this.urlParams();
      if (!this.written || !sameParams(params, this.written)) {
        untracked(() => this.store.setFilters(filtersFromParams(params)));
      }
    });

    toObservable(this.store.filters)
      .pipe(
        debounceTime(FILTER_URL_DELAY_MS),
        map(filtersToParams),
        filter((params) => !sameParams(params, this.urlParams())),
        takeUntilDestroyed(),
      )
      .subscribe((params) => {
        this.written = params;
        void this.router.navigate([], {
          queryParams: params,
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });
  }
}
