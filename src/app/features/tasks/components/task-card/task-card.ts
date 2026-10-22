import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../../../core/i18n/language.service';
import { TextPipe } from '../../../../core/i18n/text.pipe';
import {
  TASK_PRIORITY_KEYS,
  TASK_STATUSES,
  TASK_STATUS_KEYS,
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
  imports: [TextPipe, TranslatePipe, UiAvatar, UiMenu],
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

  private readonly language = inject(LanguageService);

  protected readonly priorityKey = computed(() => TASK_PRIORITY_KEYS[this.task().priority]);
  protected readonly due = computed(() => describeDueDate(this.task(), this.today()));
  protected readonly firstName = computed(() => this.task().assignee.name.split(' ')[0]);
  protected readonly checklistDone = computed(
    () => this.task().checklist.filter((item) => item.done).length,
  );
  protected readonly actions = computed<MenuAction[]>(() => [
    { label: this.language.t('COMMON.EDIT'), command: () => this.editRequest.emit() },
    ...TASK_STATUSES.filter((status) => status !== this.task().status).map((status) => ({
      label: this.language.t('CARD.MOVE_TO', {
        status: this.language.t(TASK_STATUS_KEYS[status]),
      }),
      command: () => this.moveRequest.emit(status),
    })),
    {
      label: this.language.t('COMMON.DELETE'),
      tone: 'danger' as const,
      command: () => this.deleteRequest.emit(),
    },
  ]);
}
