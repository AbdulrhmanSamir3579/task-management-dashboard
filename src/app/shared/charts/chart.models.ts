import type { BarSeriesOption, LineSeriesOption, PieSeriesOption } from 'echarts/charts';
import type {
  GridComponentOption,
  LegendComponentOption,
  TitleComponentOption,
  TooltipComponentOption,
} from 'echarts/components';
import type { ComposeOption } from 'echarts/core';

/** ECharts options for the chart kinds we support. Built by the kind services. */
export type ChartOptions = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
  | GridComponentOption
  | LegendComponentOption
  | TitleComponentOption
  | TooltipComponentOption
>;

/** Colour intent of a slice, bar or line; resolved from the design tokens. */
export type ChartTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

export interface ChartDatum {
  label: string;
  value: number;
  tone?: ChartTone;
}

export interface ChartSeries {
  name: string;
  /** One value per category, in the same order. */
  values: number[];
  tone?: ChartTone;
}

/** The numbers behind a chart, rendered as a table for screen readers. */
export interface ChartTable {
  columns: string[];
  rows: (string | number)[][];
}

/** Everything `ui-chart` needs: what to draw, the same data as a table, and whether it is empty. */
export interface ChartConfig {
  options: ChartOptions;
  table: ChartTable;
  empty: boolean;
}

/**
 * Column headings of the accessible table, already translated, e.g.
 * `{ category: 'Priority', value: 'Tasks' }`. `share` heads the percentage column of donuts.
 */
export interface ChartLabels {
  category: string;
  value?: string;
  share?: string;
}
