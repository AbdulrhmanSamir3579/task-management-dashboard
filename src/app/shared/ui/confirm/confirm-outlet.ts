import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiButton } from '../button/button';
import { UiDialog } from '../dialog/dialog';
import { ConfirmService } from './confirm.service';

/**
 * Place once in the app shell; shows questions asked through `ConfirmService`. Focus
 * starts on Cancel, so Enter never confirms a destructive action by accident.
 */
@Component({
  selector: 'ui-confirm-outlet',
  imports: [UiButton, UiDialog],
  templateUrl: './confirm-outlet.html',
  styleUrl: './confirm-outlet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiConfirmOutlet {
  protected readonly confirm = inject(ConfirmService);

  protected onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.confirm.answer(false);
    }
  }
}
