import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

interface TaskEditorState {
  open: boolean;
  /** Task being edited; `null` while creating a new one. */
  taskId: string | null;
}

/**
 * Opens the single task dialog from anywhere: the toolbar and sidebar "New Task" buttons
 * and the Edit action on cards.
 */
export const TaskEditorStore = signalStore(
  { providedIn: 'root' },
  withState<TaskEditorState>({ open: false, taskId: null }),
  withMethods((store) => ({
    openCreate(): void {
      patchState(store, { open: true, taskId: null });
    },
    openEdit(taskId: string): void {
      patchState(store, { open: true, taskId });
    },
    close(): void {
      patchState(store, { open: false, taskId: null });
    },
  })),
);
