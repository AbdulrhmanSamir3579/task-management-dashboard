import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { Toast } from 'primeng/toast';

/** Place once in the app shell; shows messages sent through `NotificationService`. */
@Component({
  selector: 'ui-toast-outlet',
  imports: [Toast],
  template: `<p-toast position="top-right" />`,
  // PrimeNG places "top-right" by the physical side; right to left, toasts open on the left.
  encapsulation: ViewEncapsulation.None,
  styles: `
    ui-toast-outlet .p-toast-top-right:dir(rtl) {
      right: auto;
      left: 1.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiToastOutlet {}
