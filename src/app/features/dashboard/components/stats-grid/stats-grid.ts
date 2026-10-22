import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { Statistic } from '../../../../core/models';
import { UiSkeleton } from '../../../../shared/ui/skeleton/skeleton';
import { StatCard } from '../stat-card/stat-card';

/** The row of statistic cards; shows skeleton cards while `stats` is `null`. */
@Component({
  selector: 'app-stats-grid',
  imports: [StatCard, TranslatePipe, UiSkeleton],
  template: `
    <section class="stats" [attr.aria-label]="'STATS.LABEL' | translate">
      @if (stats(); as list) {
        @for (stat of list; track stat.id) {
          <app-stat-card [stat]="stat" />
        }
      } @else {
        @for (placeholder of placeholders; track placeholder) {
          <div
            class="stats__skeleton"
            role="status"
            [attr.aria-label]="'STATS.LOADING' | translate"
          >
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
