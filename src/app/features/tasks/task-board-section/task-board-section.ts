import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UsersStore } from '../../../core/data-access/users.store';
import { TASK_STATUSES, type Task, type TaskStatus } from '../../../core/models';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { UiButton } from '../../../shared/ui/button/button';
import { ConfirmService } from '../../../shared/ui/confirm/confirm.service';
import { UiDrawer } from '../../../shared/ui/drawer/drawer';
import { UiSkeleton } from '../../../shared/ui/skeleton/skeleton';
import { BoardToolbar } from '../components/board-toolbar/board-toolbar';
import {
  TaskBoard,
  type TaskDrop,
  type TaskMoveRequest,
} from '../components/task-board/task-board';
import { TaskFilterPanel } from '../components/task-filter-panel/task-filter-panel';
import { TaskEditorStore } from '../data-access/task-editor.store';
import { countPanelFilters } from '../data-access/task-filters';
import { TasksStore } from '../data-access/tasks.store';

/** Toolbar and board connected to the tasks store; used by the Dashboard and Tasks pages. */
@Component({
  selector: 'app-task-board-section',
  imports: [BoardToolbar, TaskBoard, TaskFilterPanel, EmptyState, UiButton, UiDrawer, UiSkeleton],
  templateUrl: './task-board-section.html',
  styleUrl: './task-board-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBoardSection {
  protected readonly store = inject(TasksStore);
  protected readonly editor = inject(TaskEditorStore);
  protected readonly users = inject(UsersStore);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);

  protected readonly skeletonColumns = [0, 1, 2];
  protected readonly skeletonCards = [0, 1, 2];
  protected readonly filtersOpen = signal(false);

  protected readonly panelFilterCount = computed(() => countPanelFilters(this.store.filters()));
  protected readonly filterLabel = computed(() => {
    const count = this.panelFilterCount();
    return count ? `Filter (${count})` : 'Filter';
  });

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

  protected clearPanelFilters(): void {
    this.store.setFilters({ priorities: [], assigneeId: null });
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
