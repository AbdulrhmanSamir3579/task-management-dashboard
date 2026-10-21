import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { Dialog } from 'primeng/dialog';

/**
 * Modal dialog controlled from the template: `<ui-dialog header="New task" [(visible)]="open">`.
 * Footer content goes in an element marked `uiDialogFooter`.
 */
@Component({
  selector: 'ui-dialog',
  imports: [Dialog],
  template: `
    <p-dialog
      appendTo="body"
      closeAriaLabel="Close dialog"
      [header]="header()"
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="dismissable()"
      [closeOnEscape]="dismissable()"
      [closable]="dismissable()"
      [style]="{ width: width() }"
      [breakpoints]="{ '640px': '95vw' }"
      (onHide)="closed.emit()"
    >
      <ng-content />
      <ng-template #footer>
        <ng-content select="[uiDialogFooter]" />
      </ng-template>
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiDialog {
  readonly header = input.required<string>();
  readonly visible = model(false);
  readonly width = input('32rem');
  /** When false, the dialog can only be closed from its own buttons, e.g. while saving. */
  readonly dismissable = input(true);
  readonly closed = output<void>();
}
