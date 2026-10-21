import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ConfirmDialog } from 'primeng/confirmdialog';

/** Place once in the app shell; shows dialogs opened through `ConfirmService`. */
@Component({
  selector: 'ui-confirm-outlet',
  imports: [ConfirmDialog],
  template: `<p-confirmdialog [style]="{ width: '28rem' }" [breakpoints]="{ '640px': '95vw' }" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiConfirmOutlet {}
