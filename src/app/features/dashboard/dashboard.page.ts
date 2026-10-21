import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-dashboard-page',
  imports: [EmptyState],
  template: `<app-empty-state
    icon="📊"
    title="Dashboard is on its way"
    message="This page is being built."
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {}
