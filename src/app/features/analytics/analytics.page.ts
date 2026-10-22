import { NgTemplateOutlet } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LanguageService } from '../../core/i18n/language.service';
import type { TranslationKey } from '../../core/i18n/translation-key';
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
  imports: [NgTemplateOutlet, ChartCard, EmptyState, TranslatePipe, UiButton, UiChart, UiSkeleton],
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
  private readonly language = inject(LanguageService);

  /** `null` until the tasks have loaded. */
  protected readonly charts = computed(() => {
    if (!this.store.hasLoaded()) {
      return null;
    }
    // Read inside computed(), so the charts are rebuilt in the new language.
    const t = (key: TranslationKey) => this.language.t(key);
    const tasks = this.store.entities();
    const workload = workloadByAssignee(tasks, t);
    const trend = completionTrend(tasks, toIsoDate(new Date()), t, this.language.locale());
    const value = t('ANALYTICS.TASKS');
    return {
      status: this.donut.build(tasksByStatus(tasks, t), {
        category: t('ANALYTICS.STATUS'),
        value,
        share: t('ANALYTICS.SHARE'),
      }),
      priority: this.bar.build(tasksByPriority(tasks, t), {
        category: t('ANALYTICS.PRIORITY'),
        value,
      }),
      workload: this.bar.buildStacked(
        workload.categories,
        workload.series,
        { category: t('ANALYTICS.ASSIGNEE') },
        { horizontal: true },
      ),
      trend: this.line.build(trend.categories, trend.series, { category: t('ANALYTICS.DAY') }),
    };
  });
}
