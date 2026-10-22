import { DOCUMENT, DestroyRef, Injectable, inject, signal } from '@angular/core';
import type {
  GridComponentOption,
  LegendComponentOption,
  TooltipComponentOption,
} from 'echarts/components';
import type { ChartOptions, ChartTone } from './chart.models';

/** One axis, usable as `xAxis` or `yAxis`. */
type AxisOption = Exclude<NonNullable<ChartOptions['xAxis']>, unknown[]> &
  Exclude<NonNullable<ChartOptions['yAxis']>, unknown[]>;

/** Colours and font of the charts, taken from the design tokens in styles.scss. */
export interface ChartTheme {
  font: string;
  text: string;
  muted: string;
  border: string;
  surface: string;
  tones: Record<ChartTone, string>;
  /** Used in order for series without a tone. */
  palette: string[];
}

const FALLBACK = {
  font: 'Inter, system-ui, sans-serif',
  text: '#212121',
  muted: '#757575',
  border: '#e0e0e0',
  surface: '#ffffff',
  primary: '#1976d2',
  success: '#388e3c',
  warning: '#f57c00',
  danger: '#d32f2f',
};

const EXTRA_PALETTE = ['#7b1fa2', '#0097a7', '#c2185b', '#5d4037'];

/**
 * The one place that knows how our charts look in ECharts: theme colours from the design
 * tokens, and the shared pieces (tooltip, legend, axes) every chart kind starts from.
 */
@Injectable({ providedIn: 'root' })
export class EchartsService {
  private readonly document = inject(DOCUMENT);
  /** Goes up whenever the theme class or inline styles on `<html>` change. */
  private readonly themeVersion = signal(0);

  constructor() {
    const MutationObserver = this.document.defaultView?.MutationObserver;
    if (MutationObserver) {
      const observer = new MutationObserver(() => this.themeVersion.update((v) => v + 1));
      observer.observe(this.document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
      inject(DestroyRef).onDestroy(() => observer.disconnect());
    }
  }

  /**
   * Colours read from the design tokens. It is a signal read: charts built in `computed()`
   * are built again when the theme changes, e.g. to dark mode.
   */
  theme(): ChartTheme {
    this.themeVersion();
    const styles = this.document.defaultView?.getComputedStyle(this.document.documentElement);
    const token = (name: string, fallback: string): string =>
      styles?.getPropertyValue(`--app-${name}`).trim() || fallback;

    const tones: Record<ChartTone, string> = {
      primary: token('primary', FALLBACK.primary),
      success: token('success', FALLBACK.success),
      warning: token('warning', FALLBACK.warning),
      danger: token('danger', FALLBACK.danger),
      neutral: token('text-muted', FALLBACK.muted),
    };
    return {
      font: token('font', FALLBACK.font),
      text: token('text', FALLBACK.text),
      muted: tones.neutral,
      border: token('border', FALLBACK.border),
      surface: token('surface', FALLBACK.surface),
      tones,
      palette: [tones.primary, tones.success, tones.warning, tones.danger, ...EXTRA_PALETTE],
    };
  }

  /** The colour of a tone, or the `index`-th palette colour when there is no tone. */
  color(theme: ChartTheme, tone: ChartTone | undefined, index: number): string {
    return tone ? theme.tones[tone] : (theme.palette[index % theme.palette.length] ?? '');
  }

  /** Options every chart starts from: font, colours and motion. */
  base(theme: ChartTheme): ChartOptions {
    return {
      animation: !this.prefersReducedMotion(),
      color: theme.palette,
      textStyle: { fontFamily: theme.font, color: theme.text },
    };
  }

  tooltip(theme: ChartTheme, trigger: 'item' | 'axis'): TooltipComponentOption {
    return {
      trigger,
      backgroundColor: theme.surface,
      borderColor: theme.border,
      textStyle: { color: theme.text, fontFamily: theme.font },
      ...(trigger === 'axis' ? { axisPointer: { type: 'shadow' } } : {}),
    };
  }

  legend(theme: ChartTheme): LegendComponentOption {
    return {
      bottom: 0,
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: theme.text },
    };
  }

  /** Plot area of bar and line charts; axis labels stay inside the chart. */
  grid(withLegend: boolean): GridComponentOption {
    return {
      left: 8,
      right: 16,
      top: 16,
      bottom: withLegend ? 40 : 8,
      outerBoundsMode: 'same',
      outerBoundsContain: 'axisLabel',
    };
  }

  /** `edgeToEdge` starts the first label at the axis start, as line charts expect. */
  categoryAxis(theme: ChartTheme, labels: string[], edgeToEdge = false): AxisOption {
    return {
      type: 'category',
      data: labels,
      boundaryGap: !edgeToEdge,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.border } },
      axisLabel: { color: theme.muted },
    };
  }

  valueAxis(theme: ChartTheme): AxisOption {
    return {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: theme.border, type: 'dashed' } },
      axisLabel: { color: theme.muted },
    };
  }

  private prefersReducedMotion(): boolean {
    return (
      this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false
    );
  }
}
