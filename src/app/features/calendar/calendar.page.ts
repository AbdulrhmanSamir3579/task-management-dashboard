import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { UiButton } from '../../shared/ui/button/button';
import { UiSkeleton } from '../../shared/ui/skeleton/skeleton';
import { isIsoDate, toIsoDate } from '../../shared/utils/date.utils';
import { TaskEditorStore } from '../tasks/data-access/task-editor.store';
import { TasksStore } from '../tasks/data-access/tasks.store';
import { AgendaList } from './components/agenda-list/agenda-list';
import { CalendarToolbar } from './components/calendar-toolbar/calendar-toolbar';
import { MonthView } from './components/month-view/month-view';
import { WeekView } from './components/week-view/week-view';
import { buildAgenda } from './data-access/agenda';
import {
  CALENDAR_VIEWS,
  type CalendarView,
  monthGrid,
  periodLabel,
  shiftDate,
  weekDays,
  weekdayLabels,
} from './data-access/calendar-grid';

const isView = (value: string | undefined): value is CalendarView =>
  CALENDAR_VIEWS.includes(value as CalendarView);

/**
 * Tasks by due date in a month grid, a week, or an agenda. The view and the date are in
 * the URL (`?view=week&date=2026-10-22`), so the back button and shared links work;
 * month and today are the defaults and are left out.
 */
@Component({
  selector: 'app-calendar-page',
  imports: [AgendaList, CalendarToolbar, EmptyState, MonthView, UiButton, UiSkeleton, WeekView],
  templateUrl: './calendar.page.html',
  styleUrl: './calendar.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPage {
  protected readonly store = inject(TasksStore);
  protected readonly editor = inject(TaskEditorStore);
  private readonly router = inject(Router);

  // Query params, bound by the router.
  readonly view = input<string>();
  readonly date = input<string>();

  protected readonly today = computed(() => {
    // Recomputed with the tasks, so a page left open past midnight catches up.
    this.store.entities();
    return toIsoDate(new Date());
  });
  protected readonly activeView = computed<CalendarView>(() => {
    const view = this.view();
    return isView(view) ? view : 'month';
  });
  protected readonly activeDate = computed(() => {
    const date = this.date();
    return isIsoDate(date) ? date : this.today();
  });
  protected readonly label = computed(() => periodLabel(this.activeView(), this.activeDate()));
  protected readonly weekdays = weekdayLabels();
  protected readonly weeks = computed(() =>
    monthGrid(this.activeDate(), this.store.entities(), this.today()),
  );
  protected readonly days = computed(() =>
    weekDays(this.activeDate(), this.store.entities(), this.today()),
  );
  protected readonly agenda = computed(() => buildAgenda(this.store.entities(), this.today()));

  protected changeView(view: CalendarView): void {
    this.navigate(view, this.activeDate());
  }

  protected step(step: -1 | 1): void {
    this.navigate(this.activeView(), shiftDate(this.activeView(), this.activeDate(), step));
  }

  protected goToToday(): void {
    this.navigate(this.activeView(), this.today());
  }

  /** "+N more" or a day's count on phones: the week shows every task of that day. */
  protected showDay(date: string): void {
    this.navigate('week', date);
  }

  protected addTask(dueDate: string): void {
    this.editor.openCreate({ dueDate });
  }

  private navigate(view: CalendarView, date: string): void {
    void this.router.navigate([], {
      queryParams: {
        view: view === 'month' ? null : view,
        date: date === this.today() ? null : date,
      },
      queryParamsHandling: 'merge',
    });
  }
}
