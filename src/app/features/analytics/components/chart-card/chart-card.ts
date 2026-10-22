import { ChangeDetectionStrategy, Component, input } from '@angular/core';

let nextId = 0;

/** A titled card around one chart. */
@Component({
  selector: 'app-chart-card',
  template: `
    <section class="chart-card" [attr.aria-labelledby]="headingId">
      <h2 class="chart-card__title" [id]="headingId">{{ heading() }}</h2>
      @if (description()) {
        <p class="chart-card__description">{{ description() }}</p>
      }
      <ng-content />
    </section>
  `,
  styleUrl: './chart-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartCard {
  readonly heading = input.required<string>();
  readonly description = input<string>();

  protected readonly headingId = `chart-card-${nextId++}`;
}
