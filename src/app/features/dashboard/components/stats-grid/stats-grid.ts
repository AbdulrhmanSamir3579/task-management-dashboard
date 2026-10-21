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
  styles: `
    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1.5rem;
    }
    .stats__skeleton {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1.5rem;
      border-radius: var(--app-radius-md);
      background: var(--app-surface);
      box-shadow: var(--app-shadow-md);
    }
    @media (max-width: 1199.98px) {
      .stats {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 599.98px) {
      .stats {
        grid-template-columns: minmax(0, 1fr);
        gap: 1rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsGrid {
  readonly stats = input<Statistic[] | null>(null);

  protected readonly placeholders = [0, 1, 2, 3];
}
