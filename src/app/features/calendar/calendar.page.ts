import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { UiButton } from '../../shared/ui/button/button';
import { UiSkeleton } from '../../shared/ui/skeleton/skeleton';
import { toIsoDate } from '../../shared/utils/date.utils';
import { TaskEditorStore } from '../tasks/data-access/task-editor.store';
import { TasksStore } from '../tasks/data-access/tasks.store';
import { AgendaList } from './components/agenda-list/agenda-list';
import { buildAgenda } from './data-access/agenda';

/** Open tasks by due date; follows changes made anywhere in the app. */
@Component({
  selector: 'app-calendar-page',
  imports: [AgendaList, EmptyState, UiButton, UiSkeleton],
  templateUrl: './calendar.page.html',
  styleUrl: './calendar.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPage {
  protected readonly store = inject(TasksStore);
  protected readonly editor = inject(TaskEditorStore);

  protected readonly skeletons = [0, 1, 2];
  protected readonly today = computed(() => {
    // Recomputed with the tasks, so a page left open past midnight catches up.
    this.store.entities();
    return toIsoDate(new Date());
  });
  /** `null` until the tasks have loaded. */
  protected readonly groups = computed(() =>
    this.store.hasLoaded() ? buildAgenda(this.store.entities(), this.today()) : null,
  );
}
