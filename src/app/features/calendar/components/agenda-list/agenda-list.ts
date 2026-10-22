import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TextPipe } from '../../../../core/i18n/text.pipe';
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '../../../../core/models';
import { UiAvatar } from '../../../../shared/ui/avatar/avatar';
import { UiTag } from '../../../../shared/ui/tag/tag';
import { fromIsoDate } from '../../../../shared/utils/date.utils';
import { describeDueDate } from '../../../tasks/utils/due-date';
import { PRIORITY_TONES } from '../../../tasks/utils/priority-tone';
import type { AgendaGroup } from '../../data-access/agenda';

const weekday = new Intl.DateTimeFormat('en', { weekday: 'short' });
const month = new Intl.DateTimeFormat('en', { month: 'short' });
const fullDate = new Intl.DateTimeFormat('en', { dateStyle: 'full' });

/** Agenda groups with their tasks; choosing a task asks to open it. */
@Component({
  selector: 'app-agenda-list',
  imports: [TextPipe, UiAvatar, UiTag],
  templateUrl: './agenda-list.html',
  styleUrl: './agenda-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaList {
  readonly groups = input.required<AgendaGroup[]>();
  /** `YYYY-MM-DD`, for "Due in 2 days". */
  readonly today = input.required<string>();
  /** Emits the id of the chosen task. */
  readonly taskOpen = output<string>();

  protected readonly sections = computed(() =>
    this.groups().map((group) => ({
      ...group,
      entries: group.tasks.map((task) => {
        const date = fromIsoDate(task.dueDate);
        return {
          task,
          weekday: weekday.format(date),
          day: date.getDate(),
          month: month.format(date),
          fullDate: fullDate.format(date),
          due: describeDueDate(task, this.today()),
          status: TASK_STATUS_LABELS[task.status],
          priority: TASK_PRIORITY_LABELS[task.priority],
          priorityTone: PRIORITY_TONES[task.priority],
        };
      }),
    })),
  );
}
