import { Injectable, inject } from '@angular/core';
import type { BarSeriesOption } from 'echarts/charts';
import type {
  ChartConfig,
  ChartDatum,
  ChartLabels,
  ChartSeries,
  ChartTable,
} from '../chart.models';
import { EchartsService } from '../echarts.service';
import { datumTable, seriesTable, sumOf } from './chart-table';

export interface BarChartOptions {
  /** Bars grow to the right; suits long category names such as people. */
  horizontal?: boolean;
}

@Injectable({ providedIn: 'root' })
export class BarChartService {
  private readonly echarts = inject(EchartsService);

  /** One bar per category, e.g. tasks by priority. */
  build(
    data: readonly ChartDatum[],
    labels: ChartLabels,
    { horizontal = false }: BarChartOptions = {},
  ): ChartConfig {
    const theme = this.echarts.theme();
    const series: BarSeriesOption = {
      type: 'bar',
      name: labels.value ?? labels.category,
      barMaxWidth: 48,
      itemStyle: { borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0] },
      data: data.map((datum, index) => ({
        value: datum.value,
        itemStyle: { color: this.echarts.color(theme, datum.tone, index) },
      })),
    };
    return this.compose(
      data.map((datum) => datum.label),
      [series],
      { horizontal, legend: [] },
      datumTable(data, labels),
    );
  }

  /** Bars split into stacked parts, e.g. each person's tasks by status. */
  buildStacked(
    categories: readonly string[],
    series: readonly ChartSeries[],
    labels: ChartLabels,
    { horizontal = false }: BarChartOptions = {},
  ): ChartConfig {
    const theme = this.echarts.theme();
    const bars = series.map((item, index): BarSeriesOption => ({
      type: 'bar',
      name: item.name,
      stack: 'total',
      barMaxWidth: 32,
      itemStyle: { color: this.echarts.color(theme, item.tone, index) },
      data: [...item.values],
    }));
    return this.compose(
      categories,
      bars,
      { horizontal, legend: series.map((item) => item.name) },
      seriesTable(categories, series, labels),
    );
  }

  private compose(
    categories: readonly string[],
    series: BarSeriesOption[],
    layout: { horizontal: boolean; legend: readonly string[] },
    table: ChartTable,
  ): ChartConfig {
    const theme = this.echarts.theme();
    const categoryAxis = this.echarts.categoryAxis(theme, [...categories]);
    const valueAxis = this.echarts.valueAxis(theme);
    const values = table.rows.flatMap((row) => row.slice(1) as number[]);

    return {
      empty: sumOf(values) === 0,
      options: {
        ...this.echarts.base(theme),
        tooltip: this.echarts.tooltip(theme, 'axis'),
        ...(layout.legend.length ? { legend: this.echarts.legend(theme, layout.legend) } : {}),
        grid: this.echarts.grid(theme, layout.legend.length > 0),
        // Right to left the chart is mirrored: horizontal bars grow to the left from names on
        // the right, and vertical bars start from the right with the values on the right.
        xAxis: { ...(layout.horizontal ? valueAxis : categoryAxis), inverse: theme.rtl },
        // Horizontal bars list the first category at the top.
        yAxis: layout.horizontal
          ? { ...categoryAxis, inverse: true, position: theme.rtl ? 'right' : 'left' }
          : { ...valueAxis, position: theme.rtl ? 'right' : 'left' },
        series,
      },
      table,
    };
  }
}
