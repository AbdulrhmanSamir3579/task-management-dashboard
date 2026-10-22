import type { ChartDatum, ChartLabels, ChartSeries, ChartTable } from '../chart.models';

export const sumOf = (values: readonly number[]): number =>
  values.reduce((sum, value) => sum + value, 0);

export function percent(value: number, total: number): string {
  return total ? `${Math.round((value / total) * 100)}%` : '0%';
}

/** One row per datum: label and value. */
export function datumTable(data: readonly ChartDatum[], labels: ChartLabels): ChartTable {
  return {
    columns: [labels.category, labels.value ?? '#'],
    rows: data.map((datum) => [datum.label, datum.value]),
  };
}

/** One row per category, one column per series. */
export function seriesTable(
  categories: readonly string[],
  series: readonly ChartSeries[],
  labels: ChartLabels,
): ChartTable {
  return {
    columns: [labels.category, ...series.map((item) => item.name)],
    rows: categories.map((category, index) => [
      category,
      ...series.map((item) => item.values[index] ?? 0),
    ]),
  };
}
