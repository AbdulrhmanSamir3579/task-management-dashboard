import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { TextPipe } from '../../../../core/i18n/text.pipe';
import { TASK_PRIORITY_KEYS, TASK_STATUS_KEYS } from '../../../../core/models';
import { UiAvatar } from '../../../../shared/ui/avatar/avatar';
import { UiTag } from '../../../../shared/ui/tag/tag';
import { fromIsoDate } from '../../../../shared/utils/date.utils';
import { describeDueDate } from '../../../tasks/utils/due-date';
import { PRIORITY_TONES } from '../../../tasks/utils/priority-tone';
import type { AgendaGroup } from '../../data-access/agenda';

/** Agenda groups with their tasks; choosing a task asks to open it. */
@Component({
  selector: 'app-agenda-list',
  imports: [TextPipe, TranslatePipe, UiAvatar, UiTag],
  templateUrl: './agenda-list.html',
  styleUrl: './agenda-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaList {
  readonly groups = input.required<AgendaGroup[]>();
  /** `YYYY-MM-DD`, for "Due in 2 days". */
  readonly today = input.required<string>();
  /** Locale of the dates, e.g. `ar-u-nu-latn`. */
  readonly locale = input('en');
  /** Emits the id of the chosen task. */
  readonly taskOpen = output<string>();

  protected readonly sections = computed(() => {
    const locale = this.locale();
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const month = new Intl.DateTimeFormat(locale, { month: 'short' });
    const fullDate = new Intl.DateTimeFormat(locale, { dateStyle: 'full' });
    return this.groups().map((group) => ({
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
          status: TASK_STATUS_KEYS[task.status],
          priority: TASK_PRIORITY_KEYS[task.priority],
          priorityTone: PRIORITY_TONES[task.priority],
        };
      }),
    }));
  });
}
