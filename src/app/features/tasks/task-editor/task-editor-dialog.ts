import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { type Observable, map, of } from 'rxjs';
import { UsersStore } from '../../../core/data-access/users.store';
import type { CreateTaskPayload } from '../../../core/models';
import { ConfirmService } from '../../../shared/ui/confirm/confirm.service';
import { UiDialog } from '../../../shared/ui/dialog/dialog';
import { TaskEditorStore } from '../data-access/task-editor.store';
import { TasksApi } from '../data-access/tasks.api';
import { TasksStore } from '../data-access/tasks.store';
import { TaskForm } from '../task-form/task-form';

const sameTitle = (a: string, b: string): boolean =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

/** The one task dialog of the app, opened through `TaskEditorStore`. */
@Component({
  selector: 'app-task-editor-dialog',
  imports: [UiDialog, TaskForm],
  templateUrl: './task-editor-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskEditorDialog {
  protected readonly editor = inject(TaskEditorStore);
  protected readonly users = inject(UsersStore);
  private readonly tasks = inject(TasksStore);
  private readonly api = inject(TasksApi);
  private readonly confirm = inject(ConfirmService);
  private readonly form = viewChild(TaskForm);

  protected readonly saving = signal(false);
  protected readonly task = computed(() => {
    const id = this.editor.taskId();
    return id ? (this.tasks.entityMap()[id] ?? null) : null;
  });

  /** Local first, like search: loaded tasks answer at once, the API is the fallback. */
  protected readonly isTitleTaken = (title: string): Observable<boolean> => {
    const editingId = this.editor.taskId();
    const isOther = (task: { id: string; title: string }) =>
      task.id !== editingId && sameTitle(task.title, title);
    return this.tasks.hasLoaded()
      ? of(this.tasks.entities().some(isOther))
      : this.api.search(title, 10).pipe(map((tasks) => tasks.some(isOther)));
  };

  /** Unsaved changes ask before the dialog closes; an untouched form closes at once. */
  protected readonly confirmDiscard = async (): Promise<boolean> =>
    !this.form()?.hasChanges() ||
    this.confirm.confirm({
      title: 'Discard changes?',
      message: 'Your changes to this task will be lost.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      tone: 'danger',
    });

  protected onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.editor.close();
    }
  }

  protected async cancel(): Promise<void> {
    if (await this.confirmDiscard()) {
      this.editor.close();
    }
  }

  protected async save(payload: CreateTaskPayload): Promise<void> {
    this.saving.set(true);
    const id = this.editor.taskId();
    const saved = id ? await this.tasks.update(id, payload) : await this.tasks.create(payload);
    this.saving.set(false);
    // On failure the store shows the error and the dialog stays open with the user's input.
    if (saved) {
      this.editor.close();
    }
  }
}
