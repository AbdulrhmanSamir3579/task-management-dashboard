import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { TASK_PRIORITY_KEYS } from '../../../../core/models';
import { UiAvatar } from '../../../../shared/ui/avatar/avatar';
import { UiTag } from '../../../../shared/ui/tag/tag';
import { fromIsoDate } from '../../../../shared/utils/date.utils';
import { PRIORITY_TONES } from '../../../tasks/utils/priority-tone';
import type { CalendarDay } from '../../data-access/calendar-grid';

/** Seven day columns with every task due that day; days from today on can get a new task. */
@Component({
  selector: 'app-week-view',
  imports: [TranslatePipe, UiAvatar, UiTag],
  templateUrl: './week-view.html',
  styleUrl: './week-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekView {
  readonly days = input.required<CalendarDay[]>();
  /** Locale of the weekday names and dates. */
  readonly locale = input('en');
  /** Emits a task id. */
  readonly taskOpen = output<string>();
  /** Emits a date to add a task due that day. */
  readonly dayAdd = output<string>();

  protected readonly columns = computed(() => {
    const weekday = new Intl.DateTimeFormat(this.locale(), { weekday: 'short' });
    const fullDate = new Intl.DateTimeFormat(this.locale(), {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    return this.days().map((day) => {
      const date = fromIsoDate(day.date);
      return {
        ...day,
        weekday: weekday.format(date),
        fullDate: fullDate.format(date),
        entries: day.tasks.map((task) => ({
          task,
          done: task.status === 'done',
          priority: TASK_PRIORITY_KEYS[task.priority],
          tone: PRIORITY_TONES[task.priority],
        })),
      };
    });
  });
}
