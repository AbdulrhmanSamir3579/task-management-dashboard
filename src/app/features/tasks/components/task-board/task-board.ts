import {
  CdkDrag,
  type CdkDragDrop,
  CdkDragPlaceholder,
  CdkDropList,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Task,
  type TaskStatus,
} from '../../../../core/models';
import { toIsoDate } from '../../../../shared/utils/date.utils';
import type { TaskColumns } from '../../data-access/task-filters';
import type { TaskChangeState } from '../../data-access/tasks.store';
import { TaskCard } from '../task-card/task-card';

/** Where a card was dropped: its column and the card it now sits before (`null` = last). */
export interface TaskDrop {
  taskId: string;
  status: TaskStatus;
  beforeTaskId: string | null;
}

export interface TaskMoveRequest {
  task: Task;
  status: TaskStatus;
}

/** Kanban columns with drag and drop. Presentational: it only reports what the user did. */
@Component({
  selector: 'app-task-board',
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, CdkDragPlaceholder, TaskCard],
  host: { '[style.--board-columns]': 'statuses().length' },
  template: `
    <div class="board" cdkDropListGroup>
      @for (status of statuses(); track status) {
        <section class="column" [attr.aria-labelledby]="'column-title-' + status">
          <header class="column__header">
            <h2 class="column__title" [id]="'column-title-' + status">{{ labels[status] }}</h2>
            <span class="column__count" [attr.aria-label]="countLabel(columns()[status].length)">
              {{ columns()[status].length }}
            </span>
          </header>
          <div
            class="column__list"
            cdkDropList
            [cdkDropListData]="columns()[status]"
            (cdkDropListDropped)="onDrop($event, status)"
          >
            @for (task of columns()[status]; track task.id) {
              <app-task-card
                cdkDrag
                [cdkDragData]="task"
                [cdkDragDisabled]="changeStates()[task.id] === 'saving'"
                [task]="task"
                [changeState]="changeStates()[task.id]"
                [today]="today()"
                (editRequest)="editRequest.emit(task)"
                (moveRequest)="moveRequest.emit({ task, status: $event })"
                (deleteRequest)="deleteRequest.emit(task)"
              >
                <div *cdkDragPlaceholder class="column__placeholder"></div>
              </app-task-card>
            } @empty {
              <p class="column__empty">No tasks</p>
            }
          </div>
        </section>
      }
    </div>
  `,
  styleUrl: './task-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBoard {
  readonly columns = input.required<TaskColumns>();
  /** Columns to show, e.g. only "done" when the Done tab is selected. */
  readonly statuses = input<readonly TaskStatus[]>(TASK_STATUSES);
  readonly changeStates = input<Readonly<Record<string, TaskChangeState>>>({});
  readonly today = input(toIsoDate(new Date()));
  readonly dropped = output<TaskDrop>();
  readonly editRequest = output<Task>();
  readonly moveRequest = output<TaskMoveRequest>();
  readonly deleteRequest = output<Task>();

  protected readonly labels = TASK_STATUS_LABELS;

  protected countLabel(count: number): string {
    return `${count} ${count === 1 ? 'task' : 'tasks'}`;
  }

  /**
   * The column may be filtered, so the drop index is turned into "before which card"
   * rather than a position; the store works out the position from the full column.
   */
  protected onDrop(event: CdkDragDrop<Task[], Task[], Task>, status: TaskStatus): void {
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) {
      return;
    }
    const task = event.item.data;
    const others = event.container.data.filter((item) => item.id !== task.id);
    this.dropped.emit({
      taskId: task.id,
      status,
      beforeTaskId: others[event.currentIndex]?.id ?? null,
    });
  }
}
