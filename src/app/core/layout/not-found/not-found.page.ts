import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-not-found-page',
  imports: [EmptyState, RouterLink, TranslatePipe],
  template: `
    <app-empty-state
      icon="🧭"
      [title]="'NOT_FOUND.TITLE' | translate"
      [message]="'NOT_FOUND.MESSAGE' | translate"
    >
      <a routerLink="/dashboard">{{ 'NOT_FOUND.BACK' | translate }}</a>
    </app-empty-state>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
