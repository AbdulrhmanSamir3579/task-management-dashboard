import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { ChartConfig } from '../chart.models';

/**
 * Draws a chart built by a kind service: `<ui-chart label="Tasks by status" [config]="c" />`.
 * The drawing is hidden from screen readers, which get the same numbers as a table.
 */
@Component({
  selector: 'ui-chart',
  imports: [NgxEchartsDirective, TranslatePipe],
  host: { role: 'figure', '[attr.aria-label]': 'label()' },
  templateUrl: './chart.html',
  styleUrl: './chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiChart {
  readonly config = input.required<ChartConfig>();
  /** Names the chart and captions its data table. */
  readonly label = input.required<string>();
  readonly height = input('18rem');
  /** A translated "Nothing to show yet." by default. */
  readonly emptyMessage = input<string>();

  /** SVG keeps text sharp at any zoom level and is light for a few small charts. */
  protected readonly initOpts = { renderer: 'svg' } as const;
}
