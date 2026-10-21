import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-not-found-page',
  imports: [EmptyState, RouterLink],
  template: `
    <app-empty-state
      icon="🧭"
      title="Page not found"
      message="The page you are looking for does not exist or has moved."
    >
      <a routerLink="/dashboard">Back to the dashboard</a>
    </app-empty-state>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
