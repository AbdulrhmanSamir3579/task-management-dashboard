import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Card } from 'primeng/card';

@Component({
  selector: 'ui-card',
  imports: [Card],
  template: `
    <p-card [header]="title()" [subheader]="subtitle()">
      <ng-content />
    </p-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiCard {
  readonly title = input<string>();
  readonly subtitle = input<string>();
}
