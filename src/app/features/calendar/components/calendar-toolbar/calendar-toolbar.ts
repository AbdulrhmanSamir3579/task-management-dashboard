import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { CalendarView } from '../../data-access/calendar-grid';

const VIEW_OPTIONS: readonly { value: CalendarView; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'agenda', label: 'Agenda' },
];

/** Period title, previous / today / next, and the Month / Week / Agenda switch. */
@Component({
  selector: 'app-calendar-toolbar',
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
