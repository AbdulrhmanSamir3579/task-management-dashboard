import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

interface TaskEditorState {
  open: boolean;
  /** Task being edited; `null` while creating a new one. */
  taskId: string | null;
  /** Assignee chosen in advance for a new task, e.g. from the Team page. */
  assigneeId: string | null;
  /** Due date chosen in advance for a new task, e.g. a day in the calendar. */
  dueDate: string | null;
}

export interface NewTaskDefaults {
  assigneeId?: string;
  dueDate?: string;
}

const NO_DEFAULTS = { assigneeId: null, dueDate: null };

/**
 * Opens the single task dialog from anywhere: the toolbar and sidebar "New Task" buttons,
 * "Assign task" on the Team page, a day in the calendar and the Edit action on cards.
 */
export const TaskEditorStore = signalStore(
  { providedIn: 'root' },
  withState<TaskEditorState>({ open: false, taskId: null, ...NO_DEFAULTS }),
  withMethods((store) => ({
    openCreate(defaults: NewTaskDefaults = {}): void {
      patchState(store, {
        open: true,
        taskId: null,
        assigneeId: defaults.assigneeId ?? null,
        dueDate: defaults.dueDate ?? null,
      });
    },
    openEdit(taskId: string): void {
      patchState(store, { open: true, taskId, ...NO_DEFAULTS });
    },
    close(): void {
      patchState(store, { open: false, taskId: null, ...NO_DEFAULTS });
    },
  })),
);
