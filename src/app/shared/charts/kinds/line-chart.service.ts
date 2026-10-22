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
        legend: this.echarts.legend(theme),
        grid: this.echarts.grid(true),
        xAxis: this.echarts.categoryAxis(theme, [...categories], true),
        yAxis: this.echarts.valueAxis(theme),
        series: lines,
      },
      table: seriesTable(categories, series, labels),
    };
  }
}
