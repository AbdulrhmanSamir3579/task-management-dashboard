import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { Dialog } from 'primeng/dialog';

/** Return `false` (or a promise of it) to keep the dialog open, e.g. after "Keep editing". */
export type DialogCloseGuard = () => boolean | Promise<boolean>;

/**
 * Modal dialog controlled from the template: `<ui-dialog heading="New task" [(visible)]="open">`.
 * Footer content goes in an element marked `uiDialogFooter`. With `beforeClose`, the close
 * button, Escape and a click outside ask the guard first.
 */
@Component({
  selector: 'ui-dialog',
  imports: [Dialog],
  host: { '(document:keydown.escape)': 'onEscape()' },
  templateUrl: './dialog.html',
  styles: `
    .ui-dialog__close {
      position: absolute;
      inset-block-start: 1rem;
      inset-inline-end: 1rem;
      width: 2rem;
      height: 2rem;
      border: 0;
      border-radius: 50%;
      background: none;
      color: var(--app-text-muted);
      cursor: pointer;

      &:hover {
        background: var(--app-background);
      }

      &:focus-visible {
        outline: 2px solid var(--app-primary);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiDialog {
  /** Dialog title. Not called `header`: `#header` in the template is PrimeNG's slot name. */
  readonly heading = input.required<string>();
  readonly visible = model(false);
  readonly width = input('32rem');
  /** When false, the dialog can only be closed from its own buttons, e.g. while saving. */
  readonly dismissable = input(true);
  readonly beforeClose = input<DialogCloseGuard | null>(null);
  readonly closed = output<void>();

  protected readonly guarded = computed(() => this.beforeClose() !== null);

  /** Closes the dialog unless the guard says otherwise. */
  async requestClose(): Promise<void> {
    const guard = this.beforeClose();
    if (!guard || (await guard())) {
      this.visible.set(false);
    }
  }

  protected onEscape(): void {
    if (this.visible() && this.guarded() && this.dismissable()) {
      void this.requestClose();
    }
  }
}
