import { Injectable, inject } from '@angular/core';
import type { ChartConfig, ChartDatum, ChartLabels } from '../chart.models';
import { EchartsService } from '../echarts.service';
import { percent, sumOf } from './chart-table';

/** Parts of a whole, e.g. tasks by status, with the total in the middle. */
@Injectable({ providedIn: 'root' })
export class DonutChartService {
  private readonly echarts = inject(EchartsService);

  build(data: readonly ChartDatum[], labels: ChartLabels): ChartConfig {
    const theme = this.echarts.theme();
    const total = sumOf(data.map((datum) => datum.value));
    const valueLabel = labels.value ?? '#';

    return {
      empty: total === 0,
      options: {
        ...this.echarts.base(theme),
        tooltip: { ...this.echarts.tooltip(theme, 'item'), formatter: '{b}: {c} ({d}%)' },
        legend: this.echarts.legend(
          theme,
          data.map((datum) => datum.label),
        ),
        title: {
          text: String(total),
          subtext: valueLabel,
          left: 'center',
          top: '36%',
          itemGap: 4,
          textStyle: { color: theme.text, fontSize: 24, fontWeight: 700 },
          subtextStyle: { color: theme.muted },
        },
        series: [
          {
            type: 'pie',
            name: labels.category,
            radius: ['52%', '75%'],
            center: ['50%', '44%'],
            padAngle: 2,
            itemStyle: { borderRadius: 4 },
            label: { show: false },
            data: data.map((datum, index) => ({
              name: datum.label,
              value: datum.value,
              itemStyle: { color: this.echarts.color(theme, datum.tone, index) },
            })),
          },
        ],
      },
      table: {
        columns: [labels.category, valueLabel, labels.share ?? '%'],
        rows: data.map((datum) => [datum.label, datum.value, percent(datum.value, total)]),
      },
    };
  }
}
