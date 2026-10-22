import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { UiChart } from '../../shared/charts/chart/chart';
import { BarChartService } from '../../shared/charts/kinds/bar-chart.service';
import { DonutChartService } from '../../shared/charts/kinds/donut-chart.service';
import { LineChartService } from '../../shared/charts/kinds/line-chart.service';
import { provideCharts } from '../../shared/charts/provide-charts';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { UiButton } from '../../shared/ui/button/button';
import { UiSkeleton } from '../../shared/ui/skeleton/skeleton';
import { toIsoDate } from '../../shared/utils/date.utils';
import { TasksStore } from '../tasks/data-access/tasks.store';
import { ChartCard } from './components/chart-card/chart-card';
import {
  completionTrend,
  tasksByPriority,
  tasksByStatus,
  workloadByAssignee,
} from './data-access/task-analytics';

/** Charts of the tasks in the store; they follow every change made on the board. */
@Component({
  selector: 'app-analytics-page',
  imports: [NgTemplateOutlet, ChartCard, EmptyState, UiButton, UiChart, UiSkeleton],
  // Provided here so the chart code stays in this page's lazy chunk.
  providers: [provideCharts()],
  templateUrl: './analytics.page.html',
  styleUrl: './analytics.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsPage {
  protected readonly store = inject(TasksStore);
  private readonly donut = inject(DonutChartService);
  private readonly bar = inject(BarChartService);
  private readonly line = inject(LineChartService);

  /** `null` until the tasks have loaded. */
  protected readonly charts = computed(() => {
    if (!this.store.hasLoaded()) {
      return null;
    }
    const tasks = this.store.entities();
    const workload = workloadByAssignee(tasks);
    const trend = completionTrend(tasks, toIsoDate(new Date()));
    return {
      status: this.donut.build(tasksByStatus(tasks), { category: 'Status', value: 'Tasks' }),
      priority: this.bar.build(tasksByPriority(tasks), { category: 'Priority', value: 'Tasks' }),
      workload: this.bar.buildStacked(
        workload.categories,
        workload.series,
        { category: 'Assignee' },
        { horizontal: true },
      ),
      trend: this.line.build(trend.categories, trend.series, { category: 'Day' }),
    };
  });
}
