import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toIsoDate } from '../../shared/utils/date.utils';
import { TasksStore } from '../tasks/data-access/tasks.store';
import { TaskBoardSection } from '../tasks/task-board-section/task-board-section';
import { StatsGrid } from './components/stats-grid/stats-grid';
import { computeTaskStats } from './data-access/task-stats';

/** Statistic cards over the task board, as in the design. */
@Component({
  selector: 'app-dashboard-page',
  imports: [StatsGrid, TaskBoardSection],
  template: `
    <div class="dashboard">
      <app-stats-grid [stats]="stats()" />
      <app-task-board-section />
    </div>
  `,
  styles: `
    .dashboard {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly store = inject(TasksStore);

  /** Recomputed whenever a task changes, so the cards always agree with the board. */
  protected readonly stats = computed(() =>
    this.store.hasLoaded() ? computeTaskStats(this.store.entities(), toIsoDate(new Date())) : null,
  );
}
