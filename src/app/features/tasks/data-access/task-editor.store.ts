import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

interface TaskEditorState {
  open: boolean;
  /** Task being edited; `null` while creating a new one. */
  taskId: string | null;
  /** Assignee chosen in advance for a new task, e.g. from the Team page. */
  assigneeId: string | null;
}

export interface NewTaskDefaults {
  assigneeId?: string;
}

/**
 * Opens the single task dialog from anywhere: the toolbar and sidebar "New Task" buttons,
 * "Assign task" on the Team page and the Edit action on cards.
 */
export const TaskEditorStore = signalStore(
  { providedIn: 'root' },
  withState<TaskEditorState>({ open: false, taskId: null, assigneeId: null }),
  withMethods((store) => ({
    openCreate(defaults: NewTaskDefaults = {}): void {
      patchState(store, { open: true, taskId: null, assigneeId: defaults.assigneeId ?? null });
    },
    openEdit(taskId: string): void {
      patchState(store, { open: true, taskId, assigneeId: null });
    },
    close(): void {
      patchState(store, { open: false, taskId: null, assigneeId: null });
    },
  })),
);
