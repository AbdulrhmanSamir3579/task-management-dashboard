import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { TasksStore } from './data-access/tasks.store';
import { TaskBoardSection } from './task-board-section/task-board-section';

@Component({
  selector: 'app-tasks-page',
  imports: [TaskBoardSection],
  template: `<app-task-board-section />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksPage {
  private readonly store = inject(TasksStore);

  /** `?q=` from the header search, bound by the router. */
  readonly q = input<string>();

  constructor() {
    effect(() => this.store.setFilters({ search: this.q() ?? '' }));
  }
}
