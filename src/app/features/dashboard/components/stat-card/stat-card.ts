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
  styles: `
    :host {
      display: block;
    }
    .stat {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      height: 100%;
      padding: 1.5rem;
      border-radius: var(--app-radius-md);
      background: var(--app-surface);
      box-shadow: var(--app-shadow-md);
    }
    .stat__title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      color: var(--app-text-muted);
      font-size: 0.8125rem;
    }
    .stat__icon {
      font-size: 1.25rem;
    }
    .stat__value {
      margin: 0;
      color: var(--app-text);
      font-size: 1.875rem;
      font-weight: 700;
      line-height: 1.2;
    }
    .stat__change {
      margin: 0;
      font-size: 0.71875rem;
    }
    .stat__change--positive {
      color: var(--app-success);
    }
    .stat__change--neutral {
      color: var(--app-text-muted);
    }
    .stat__change--negative {
      color: var(--app-danger);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCard {
  readonly stat = input.required<Statistic>();
}
