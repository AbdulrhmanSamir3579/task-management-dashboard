import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PluralPipe } from '../../../../core/i18n/plural.pipe';
import { fromIsoDate } from '../../../../shared/utils/date.utils';
import type { CalendarDay } from '../../data-access/calendar-grid';

/** Tasks shown in a day cell before "+N more". */
export const MAX_TASKS_PER_DAY = 3;

/** Month grid: each day lists its tasks; days from today on can get a new task. */
@Component({
  selector: 'app-month-view',
  imports: [PluralPipe, TranslatePipe],
  templateUrl: './month-view.html',
  styleUrl: './month-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthView {
  readonly weeks = input.required<CalendarDay[][]>();
  /** Column headings, e.g. Mon … Sun. */
  readonly weekdays = input.required<string[]>();
  /** Locale of the dates read to screen readers. */
  readonly locale = input('en');
  /** Emits a task id. */
  readonly taskOpen = output<string>();
  /** Emits a date to add a task due that day. */
  readonly dayAdd = output<string>();
  /** Emits a date whose tasks do not all fit, to show them in full. */
  readonly dayShow = output<string>();

  protected readonly rows = computed(() => {
    const fullDate = new Intl.DateTimeFormat(this.locale(), {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    return this.weeks().map((week) =>
      week.map((day) => ({
        ...day,
        fullDate: fullDate.format(fromIsoDate(day.date)),
        visible: day.tasks.slice(0, MAX_TASKS_PER_DAY),
        hidden: Math.max(0, day.tasks.length - MAX_TASKS_PER_DAY),
      })),
    );
  });
}
