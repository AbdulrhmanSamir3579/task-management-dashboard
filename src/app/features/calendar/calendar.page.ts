import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-calendar-page',
  imports: [EmptyState],
  template: `<app-empty-state
    icon="📅"
    title="Calendar is on its way"
    message="This page is being built."
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPage {}
