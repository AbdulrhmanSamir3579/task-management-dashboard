import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Statistic } from '../../../../core/models';
import { UiSkeleton } from '../../../../shared/ui/skeleton/skeleton';
import { StatCard } from '../stat-card/stat-card';

/** The row of statistic cards; shows skeleton cards while `stats` is `null`. */
@Component({
  selector: 'app-stats-grid',
  imports: [StatCard, UiSkeleton],
  template: `
    <section class="stats" aria-label="Task statistics">
      @if (stats(); as list) {
        @for (stat of list; track stat.id) {
          <app-stat-card [stat]="stat" />
        }
      } @else {
        @for (placeholder of placeholders; track placeholder) {
          <div class="stats__skeleton" role="status" aria-label="Loading statistics">
            <ui-skeleton width="55%" height="1rem" />
            <ui-skeleton width="30%" height="2.25rem" />
            <ui-skeleton width="45%" height="0.75rem" />
          </div>
        }
      }
    </section>
  `,
  styleUrl: './stats-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsGrid {
  readonly stats = input<Statistic[] | null>(null);

  protected readonly placeholders = [0, 1, 2, 3];
}
