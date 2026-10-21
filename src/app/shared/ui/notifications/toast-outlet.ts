import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Toast } from 'primeng/toast';

/** Place once in the app shell; shows messages sent through `NotificationService`. */
@Component({
  selector: 'ui-toast-outlet',
  imports: [Toast],
  template: `<p-toast position="top-right" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiToastOutlet {}
