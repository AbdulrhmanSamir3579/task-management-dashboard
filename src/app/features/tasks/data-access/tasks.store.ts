import { computed, effect, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { debounceTime, distinctUntilChanged, pipe, tap } from 'rxjs';
import { type Task, toTask } from '../../../core/models';
import { toIsoDate } from '../../../shared/utils/date.utils';
import {
  EMPTY_TASK_FILTERS,
  type TaskFilters,
  filterTasks,
  groupByStatus,
  hasActiveFilters,
} from './task-filters';
import { TasksApi } from './tasks.api';

export const SEARCH_DEBOUNCE_MS = 250;

interface TasksState {
  filters: TaskFilters;
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/**
 * Single source of truth for tasks. `httpResource` loads them; the store keeps them in
 * entity state, so every page shares the same data without fetching it again, and all
 * changes go through the store's methods. Members starting with `_` are private.
 */
export const TasksStore = signalStore(
  { providedIn: 'root' },
  withEntities<Task>(),
  withState<TasksState>({ filters: EMPTY_TASK_FILTERS }),
  withProps(() => {
    const api = inject(TasksApi);
    return { _api: api, _resource: api.listResource() };
  }),
  withComputed(({ entities, filters, _resource }) => {
    const filteredTasks = computed(() => filterTasks(entities(), filters()));
    return {
      isLoading: computed(() => _resource.isLoading()),
      hasLoaded: computed(() => _resource.hasValue()),
      /** Message of the last failed load; tasks loaded earlier stay visible. */
      loadError: computed(() =>
        _resource.status() === 'error'
          ? messageOf(_resource.error(), 'Tasks could not be loaded.')
          : null,
      ),
      filteredTasks,
      columns: computed(() => groupByStatus(filteredTasks())),
      hasActiveFilters: computed(() => hasActiveFilters(filters())),
    };
  }),
  withMethods((store) => ({
    setFilters(filters: Partial<TaskFilters>): void {
      patchState(store, (state) => ({ filters: { ...state.filters, ...filters } }));
    },
    resetFilters(): void {
      patchState(store, { filters: EMPTY_TASK_FILTERS });
    },
    /** Debounced, so the board does not re-filter on every keystroke. */
    search: rxMethod<string>(
      pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        tap((search) => patchState(store, (state) => ({ filters: { ...state.filters, search } }))),
      ),
    ),
    reload(): void {
      store._resource.reload();
    },
  })),
  withHooks({
    onInit(store) {
      // Each successful load replaces the entity state with the server's tasks.
      effect(() => {
        if (store._resource.hasValue()) {
          const today = toIsoDate(new Date());
          const tasks = store._resource.value()?.tasks ?? [];
          patchState(store, setAllEntities(tasks.map((dto) => toTask(dto, today))));
        }
      });
    },
  }),
);
