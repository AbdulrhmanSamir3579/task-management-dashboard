import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { TranslationKey } from '../../../../core/i18n/translation-key';
import type { CalendarView } from '../../data-access/calendar-grid';

const VIEW_OPTIONS: readonly { value: CalendarView; label: TranslationKey }[] = [
  { value: 'month', label: 'CALENDAR.MONTH' },
  { value: 'week', label: 'CALENDAR.WEEK' },
  { value: 'agenda', label: 'CALENDAR.AGENDA' },
];

/** Period title, previous / today / next, and the Month / Week / Agenda switch. */
@Component({
  selector: 'app-calendar-toolbar',
  imports: [TranslatePipe],
  templateUrl: './calendar-toolbar.html',
  styleUrl: './calendar-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarToolbar {
  readonly view = input.required<CalendarView>();
  /** E.g. "October 2026". */
  readonly label = input.required<string>();
  readonly viewChange = output<CalendarView>();
  readonly previous = output<void>();
  readonly next = output<void>();
  readonly goToToday = output<void>();

  protected readonly views = VIEW_OPTIONS;
}
