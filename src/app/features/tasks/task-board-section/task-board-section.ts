import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TASK_STATUSES, type Task, type TaskStatus } from '../../../core/models';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { UiButton } from '../../../shared/ui/button/button';
import { ConfirmService } from '../../../shared/ui/confirm/confirm.service';
import { UiSkeleton } from '../../../shared/ui/skeleton/skeleton';
import { BoardToolbar } from '../components/board-toolbar/board-toolbar';
import {
  TaskBoard,
  type TaskDrop,
  type TaskMoveRequest,
} from '../components/task-board/task-board';
import { TaskEditorStore } from '../data-access/task-editor.store';
import { TasksStore } from '../data-access/tasks.store';

/** Toolbar and board connected to the tasks store; used by the Dashboard and Tasks pages. */
@Component({
  selector: 'app-task-board-section',
  imports: [BoardToolbar, TaskBoard, EmptyState, UiButton, UiSkeleton],
  templateUrl: './task-board-section.html',
  styles: `
    .section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .search-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      align-self: flex-start;
      margin: 0;
      padding: 0.25rem 0.5rem 0.25rem 0.75rem;
      border-radius: 1rem;
      background: var(--app-surface);
      box-shadow: var(--app-shadow-sm);
      font-size: 0.8125rem;
    }
    .search-chip__clear {
      border: 0;
      background: none;
      color: var(--app-text-muted);
      cursor: pointer;
    }
    .skeleton-board {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1.5rem;
    }
    .skeleton-board__column {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      border-radius: var(--app-radius-md);
      background: var(--app-surface);
      box-shadow: var(--app-shadow-sm);
    }
    @media (max-width: 991.98px) {
      .skeleton-board {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBoardSection {
  protected readonly store = inject(TasksStore);
  protected readonly editor = inject(TaskEditorStore);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);

  protected readonly skeletonColumns = [0, 1, 2];
  protected readonly skeletonCards = [0, 1, 2];

  /** The status tab that is selected; `null` when every status is shown. */
  protected readonly selectedStatus = computed<TaskStatus | null>(() => {
    const { statuses } = this.store.filters();
    return statuses.length === 1 ? (statuses[0] ?? null) : null;
  });

  protected readonly visibleStatuses = computed(() => {
    const { statuses } = this.store.filters();
    return statuses.length
      ? TASK_STATUSES.filter((status) => statuses.includes(status))
      : TASK_STATUSES;
  });

  protected selectStatus(status: TaskStatus | null): void {
    this.store.setFilters({ statuses: status ? [status] : [] });
  }

  protected drop({ taskId, status, beforeTaskId }: TaskDrop): void {
    this.store.drop(taskId, status, beforeTaskId);
  }

  /** "Move to" from the card menu puts the card at the end of the column. */
  protected moveTo({ task, status }: TaskMoveRequest): void {
    this.store.drop(task.id, status, null);
  }

  protected async confirmDelete(task: Task): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Delete task?',
      message: `"${task.title}" will be removed from the board. This cannot be undone.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (confirmed) {
      this.store.remove(task.id);
    }
  }

  protected clearSearch(): void {
    this.store.setFilters({ search: '' });
    this.removeSearchFromUrl();
  }

  protected clearFilters(): void {
    this.store.resetFilters();
    this.removeSearchFromUrl();
  }

  private removeSearchFromUrl(): void {
    void this.router.navigate([], { queryParams: { q: null }, queryParamsHandling: 'merge' });
  }
}
