import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Statistic } from '../../../../core/models';

@Component({
  selector: 'app-stat-card',
  template: `
    <article class="stat" [attr.aria-label]="stat().title">
      <p class="stat__title">
        <span class="stat__icon" aria-hidden="true">{{ stat().icon }}</span>
        {{ stat().title }}
      </p>
      <p class="stat__value">{{ stat().value }}</p>
      <p class="stat__change" [class]="'stat__change--' + stat().changeType">
        {{ stat().change }} {{ stat().changeLabel }}
      </p>
    </article>
  `,
  styleUrl: './stat-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCard {
  readonly stat = input.required<Statistic>();
}
