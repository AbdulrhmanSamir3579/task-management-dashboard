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
import { addEntity, setAllEntities, setEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { debounceTime, distinctUntilChanged, firstValueFrom, pipe, tap } from 'rxjs';
import {
  type CreateTaskPayload,
  type Task,
  type TaskDto,
  type TaskStatus,
  type UpdateTaskPayload,
  isTaskOverdue,
  toTask,
} from '../../../core/models';
import { NotificationService } from '../../../shared/ui/notifications/notification.service';
import { moveOnBoard, removeFromBoard } from '../../../shared/utils/board-order';
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

const today = (): string => toIsoDate(new Date());

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
    return {
      _api: api,
      _resource: api.listResource(),
      _notifications: inject(NotificationService),
    };
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
  withMethods((store) => {
    const saveFromServer = (dto: TaskDto): void =>
      patchState(store, setEntity(toTask(dto, today())));

    return {
      /** Resolves `true` once the server has created the task. */
      async create(payload: CreateTaskPayload): Promise<boolean> {
        try {
          const dto = await firstValueFrom(store._api.create(payload));
          patchState(store, addEntity(toTask(dto, today())));
          store._notifications.success(`"${dto.title}" was added to the board.`, 'Task created');
          return true;
        } catch (error) {
          store._notifications.error(messageOf(error, 'The task could not be created.'));
          return false;
        }
      },

      /** Resolves `true` once the server has saved the changes. */
      async update(id: string, changes: UpdateTaskPayload): Promise<boolean> {
        try {
          saveFromServer(await firstValueFrom(store._api.update(id, changes)));
          store._notifications.success('Your changes were saved.', 'Task updated');
          return true;
        } catch (error) {
          store._notifications.error(messageOf(error, 'The task could not be saved.'));
          return false;
        }
      },

      /** Optimistic: the card moves at once and goes back if the server refuses. */
      async move(id: string, status: TaskStatus, position: number): Promise<boolean> {
        const previous = store.entities();
        const moved = moveOnBoard(previous, id, status, position).map((task) => ({
          ...task,
          isOverdue: isTaskOverdue(task, today()),
        }));
        patchState(store, setAllEntities(moved));
        try {
          saveFromServer(await firstValueFrom(store._api.update(id, { status, position })));
          return true;
        } catch (error) {
          patchState(store, setAllEntities(previous));
          store._notifications.error(messageOf(error, 'The task could not be moved.'));
          return false;
        }
      },

      /** Optimistic: the card disappears at once and comes back if the server refuses. */
      async remove(id: string): Promise<boolean> {
        const previous = store.entities();
        const title = store.entityMap()[id]?.title ?? 'The task';
        patchState(store, setAllEntities(removeFromBoard(previous, id)));
        try {
          await firstValueFrom(store._api.remove(id), { defaultValue: undefined });
          store._notifications.success(`"${title}" was deleted.`, 'Task deleted');
          return true;
        } catch (error) {
          patchState(store, setAllEntities(previous));
          store._notifications.error(messageOf(error, 'The task could not be deleted.'));
          return false;
        }
      },
    };
  }),
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
