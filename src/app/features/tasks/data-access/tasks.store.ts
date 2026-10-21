import { InjectionToken, computed, effect, inject, untracked } from '@angular/core';
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
import {
  EMPTY,
  type Observable,
  catchError,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  finalize,
  firstValueFrom,
  pipe,
  tap,
} from 'rxjs';
import {
  type CreateTaskPayload,
  type Task,
  type TaskDto,
  type TaskStatus,
  type TasksResponse,
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

/** How long a card shows the result of a board change before returning to normal. */
export const TASK_FEEDBACK_MS = new InjectionToken<number>('TASK_FEEDBACK_MS', {
  providedIn: 'root',
  factory: () => 1500,
});

/** Feedback for a card after a move or delete: muted while saving, then a short flash. */
export type TaskChangeState = 'saving' | 'saved' | 'failed';

interface TasksState {
  filters: TaskFilters;
  changeStates: Record<string, TaskChangeState>;
}

/** One optimistic board change waiting for the server. */
interface BoardChange {
  taskId: string;
  request: () => Observable<unknown>;
  onSuccess: (response: unknown) => void;
  /** Puts the card back; only called when no newer change for the card is waiting. */
  rollback: () => void;
  errorMessage: string;
}

const today = (): string => toIsoDate(new Date());

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/**
 * Single source of truth for tasks. `httpResource` loads them; the store keeps them in
 * entity state, so every page shares the same data without fetching it again, and all
 * changes go through the store's methods. Members starting with `_` are private.
 *
 * Board changes (move, delete) are optimistic and race-free:
 * - they are queued and sent one at a time, in the order the user made them;
 * - a server response only touches a card when no newer change for it is waiting;
 * - a failed change puts the card back, and once the queue is empty the store reloads
 *   from the server, which is the source of truth;
 * - data loaded while changes are waiting is discarded and loaded again afterwards.
 */
export const TasksStore = signalStore(
  { providedIn: 'root' },
  withEntities<Task>(),
  withState<TasksState>({ filters: EMPTY_TASK_FILTERS, changeStates: {} }),
  withProps(() => {
    const api = inject(TasksApi);
    return {
      _api: api,
      _resource: api.listResource(),
      _notifications: inject(NotificationService),
      _feedbackMs: inject(TASK_FEEDBACK_MS),
      _sync: {
        /** Changes waiting for the server, per task. */
        pending: new Map<string, number>(),
        needsReload: false,
        lastLoaded: undefined as TasksResponse | undefined,
        flashTimers: new Map<string, ReturnType<typeof setTimeout>>(),
      },
    };
  }),
  withComputed(({ entities, filters, changeStates, _resource }) => {
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
      /** True while any board change is waiting for the server. */
      isSyncing: computed(() => Object.values(changeStates()).includes('saving')),
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
    const { pending, flashTimers } = store._sync;

    const setChangeState = (taskId: string, state: TaskChangeState | null): void => {
      clearTimeout(flashTimers.get(taskId));
      flashTimers.delete(taskId);
      patchState(store, ({ changeStates }) => {
        const next = { ...changeStates };
        if (state) {
          next[taskId] = state;
        } else {
          delete next[taskId];
        }
        return { changeStates: next };
      });
    };

    const flash = (taskId: string, result: 'saved' | 'failed'): void => {
      setChangeState(taskId, result);
      flashTimers.set(
        taskId,
        setTimeout(() => setChangeState(taskId, null), store._feedbackMs),
      );
    };

    const isLatestChange = (taskId: string): boolean => pending.get(taskId) === 1;

    const totalPending = (): number => [...pending.values()].reduce((sum, count) => sum + count, 0);

    return {
      _setBoard(tasks: Task[]): void {
        const day = today();
        patchState(
          store,
          setAllEntities(tasks.map((task) => ({ ...task, isOverdue: isTaskOverdue(task, day) }))),
        );
      },

      _begin(taskId: string): void {
        pending.set(taskId, (pending.get(taskId) ?? 0) + 1);
        setChangeState(taskId, 'saving');
      },

      /** Runs queued board changes one at a time; newer changes wait for older ones. */
      _runQueue: rxMethod<BoardChange>(
        pipe(
          concatMap((change) => {
            let succeeded = false;
            return change.request().pipe(
              tap((response) => {
                succeeded = true;
                if (isLatestChange(change.taskId)) {
                  change.onSuccess(response);
                }
              }),
              catchError((error: unknown) => {
                store._sync.needsReload = true;
                if (isLatestChange(change.taskId)) {
                  change.rollback();
                }
                store._notifications.error(messageOf(error, change.errorMessage));
                return EMPTY;
              }),
              finalize(() => {
                const left = (pending.get(change.taskId) ?? 1) - 1;
                if (left > 0) {
                  pending.set(change.taskId, left);
                } else {
                  pending.delete(change.taskId);
                  flash(change.taskId, succeeded ? 'saved' : 'failed');
                }
                if (totalPending() === 0 && store._sync.needsReload) {
                  store._sync.needsReload = false;
                  store._resource.reload();
                }
              }),
            );
          }),
        ),
      ),

      _hasPendingChanges(): boolean {
        return totalPending() > 0;
      },
    };
  }),
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

      /** Moves a card at once; it goes back to where it was if the server refuses. */
      move(id: string, status: TaskStatus, position: number): void {
        const task = store.entityMap()[id];
        if (!task || (task.status === status && task.position === position)) {
          return;
        }
        const origin = { status: task.status, position: task.position };

        store._setBoard(moveOnBoard(store.entities(), id, status, position));
        store._begin(id);
        store._runQueue({
          taskId: id,
          request: () => store._api.update(id, { status, position }),
          onSuccess: (dto) => saveFromServer(dto as TaskDto),
          rollback: () =>
            store._setBoard(moveOnBoard(store.entities(), id, origin.status, origin.position)),
          errorMessage: `"${task.title}" could not be moved.`,
        });
      },

      /** Removes a card at once; it comes back to its place if the server refuses. */
      remove(id: string): void {
        const task = store.entityMap()[id];
        if (!task) {
          return;
        }

        store._setBoard(removeFromBoard(store.entities(), id));
        store._begin(id);
        store._runQueue({
          taskId: id,
          request: () => store._api.remove(id),
          onSuccess: () =>
            store._notifications.success(`"${task.title}" was deleted.`, 'Task deleted'),
          rollback: () =>
            store._setBoard(
              moveOnBoard([...store.entities(), task], id, task.status, task.position),
            ),
          errorMessage: `"${task.title}" could not be deleted.`,
        });
      },
    };
  }),
  withHooks({
    onInit(store) {
      effect(() => {
        if (!store._resource.hasValue()) {
          return;
        }
        const response = store._resource.value();
        if (!response || response === store._sync.lastLoaded) {
          return;
        }
        store._sync.lastLoaded = response;

        // Loaded before the waiting changes reached the server: load again once they have.
        if (untracked(() => store._hasPendingChanges())) {
          store._sync.needsReload = true;
          return;
        }
        const day = today();
        patchState(store, setAllEntities(response.tasks.map((dto) => toTask(dto, day))));
      });
    },
  }),
);
