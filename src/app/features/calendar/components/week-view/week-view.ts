import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TASK_PRIORITY_LABELS } from '../../../../core/models';
import { UiAvatar } from '../../../../shared/ui/avatar/avatar';
import { UiTag } from '../../../../shared/ui/tag/tag';
import { fromIsoDate } from '../../../../shared/utils/date.utils';
import { PRIORITY_TONES } from '../../../tasks/utils/priority-tone';
import type { CalendarDay } from '../../data-access/calendar-grid';

const weekday = new Intl.DateTimeFormat('en', { weekday: 'short' });
const fullDate = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' });

/** Seven day columns with every task due that day; days from today on can get a new task. */
@Component({
  selector: 'app-week-view',
  imports: [UiAvatar, UiTag],
  templateUrl: './week-view.html',
  styleUrl: './week-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekView {
  readonly days = input.required<CalendarDay[]>();
  /** Emits a task id. */
  readonly taskOpen = output<string>();
  /** Emits a date to add a task due that day. */
  readonly dayAdd = output<string>();

  protected readonly columns = computed(() =>
    this.days().map((day) => {
      const date = fromIsoDate(day.date);
      return {
        ...day,
        weekday: weekday.format(date),
        fullDate: fullDate.format(date),
        entries: day.tasks.map((task) => ({
          task,
          done: task.status === 'done',
          priority: TASK_PRIORITY_LABELS[task.priority],
          tone: PRIORITY_TONES[task.priority],
        })),
      };
    }),
  );
}
