import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-settings-page',
  imports: [EmptyState],
  template: `<app-empty-state
    icon="⚙️"
    title="Settings is on its way"
    message="This page is being built."
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {}
