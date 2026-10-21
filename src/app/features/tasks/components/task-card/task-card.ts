import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Task,
  type TaskStatus,
} from '../../../../core/models';
import { UiAvatar } from '../../../../shared/ui/avatar/avatar';
import { UiMenu } from '../../../../shared/ui/menu/menu';
import type { MenuAction } from '../../../../shared/ui/ui.types';
import { toIsoDate } from '../../../../shared/utils/date.utils';
import type { TaskChangeState } from '../../data-access/tasks.store';
import { describeDueDate } from '../../utils/due-date';

/** One task on the board. Shows the result of a move or delete as a short flash. */
@Component({
  selector: 'app-task-card',
  imports: [UiAvatar, UiMenu],
  host: {
    '[class.task-card--overdue]': 'task().isOverdue',
    '[class.task-card--saving]': "changeState() === 'saving'",
    '[class.task-card--saved]': "changeState() === 'saved'",
    '[class.task-card--failed]': "changeState() === 'failed'",
    '[attr.aria-busy]': "changeState() === 'saving' || null",
  },
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCard {
  readonly task = input.required<Task>();
  readonly changeState = input<TaskChangeState>();
  /** `YYYY-MM-DD` the due date is described against. */
  readonly today = input(toIsoDate(new Date()));
  readonly editRequest = output<void>();
  readonly moveRequest = output<TaskStatus>();
  readonly deleteRequest = output<void>();

  protected readonly priorityLabel = computed(() => TASK_PRIORITY_LABELS[this.task().priority]);
  protected readonly due = computed(() => describeDueDate(this.task(), this.today()));
  protected readonly firstName = computed(() => this.task().assignee.name.split(' ')[0]);
  protected readonly actions = computed<MenuAction[]>(() => [
    { label: 'Edit', command: () => this.editRequest.emit() },
    ...TASK_STATUSES.filter((status) => status !== this.task().status).map((status) => ({
      label: `Move to ${TASK_STATUS_LABELS[status]}`,
      command: () => this.moveRequest.emit(status),
    })),
    { label: 'Delete', tone: 'danger' as const, command: () => this.deleteRequest.emit() },
  ]);
}
