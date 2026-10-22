import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { fromIsoDate } from '../../../../shared/utils/date.utils';
import type { CalendarDay } from '../../data-access/calendar-grid';

/** Tasks shown in a day cell before "+N more". */
export const MAX_TASKS_PER_DAY = 3;

const fullDate = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' });

/** Month grid: each day lists its tasks; days from today on can get a new task. */
@Component({
  selector: 'app-month-view',
  templateUrl: './month-view.html',
  styleUrl: './month-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthView {
  readonly weeks = input.required<CalendarDay[][]>();
  /** Column headings, e.g. Mon … Sun. */
  readonly weekdays = input.required<string[]>();
  /** Emits a task id. */
  readonly taskOpen = output<string>();
  /** Emits a date to add a task due that day. */
  readonly dayAdd = output<string>();
  /** Emits a date whose tasks do not all fit, to show them in full. */
  readonly dayShow = output<string>();

  protected readonly rows = computed(() =>
    this.weeks().map((week) =>
      week.map((day) => ({
        ...day,
        fullDate: fullDate.format(fromIsoDate(day.date)),
        visible: day.tasks.slice(0, MAX_TASKS_PER_DAY),
        hidden: Math.max(0, day.tasks.length - MAX_TASKS_PER_DAY),
      })),
    ),
  );
}
