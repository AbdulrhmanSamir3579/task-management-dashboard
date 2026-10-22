import { Injectable, inject } from '@angular/core';
import type { LineSeriesOption } from 'echarts/charts';
import type { ChartConfig, ChartLabels, ChartSeries } from '../chart.models';
import { EchartsService } from '../echarts.service';
import { seriesTable, sumOf } from './chart-table';

/** Values over time, one line per series, e.g. tasks created and completed per day. */
@Injectable({ providedIn: 'root' })
export class LineChartService {
  private readonly echarts = inject(EchartsService);

  build(
    categories: readonly string[],
    series: readonly ChartSeries[],
    labels: ChartLabels,
  ): ChartConfig {
    const theme = this.echarts.theme();
    const lines = series.map((item, index): LineSeriesOption => {
      const color = this.echarts.color(theme, item.tone, index);
      return {
        type: 'line',
        name: item.name,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color },
        lineStyle: { width: 2 },
        areaStyle: { color, opacity: 0.08 },
        data: [...item.values],
      };
    });

    return {
      empty: sumOf(series.flatMap((item) => item.values)) === 0,
      options: {
        ...this.echarts.base(theme),
        tooltip: { ...this.echarts.tooltip(theme, 'axis'), axisPointer: { type: 'line' } },
        legend: this.echarts.legend(
          theme,
          series.map((item) => item.name),
        ),
        grid: this.echarts.grid(theme, true),
        // Right to left, time runs from right to left and the values sit on the right.
        xAxis: { ...this.echarts.categoryAxis(theme, [...categories], true), inverse: theme.rtl },
        yAxis: { ...this.echarts.valueAxis(theme), position: theme.rtl ? 'right' : 'left' },
        series: lines,
      },
      table: seriesTable(categories, series, labels),
    };
  }
}
