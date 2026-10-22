import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { Drawer } from 'primeng/drawer';

let nextId = 0;

/**
 * Side panel controlled from the template: `<ui-drawer heading="Filters" [(visible)]="open">`.
 * Footer content goes in an element marked `uiDrawerFooter`. It is announced as a modal
 * dialog named by its heading, and keeps focus inside while open.
 */
@Component({
  selector: 'ui-drawer',
  imports: [Drawer],
  templateUrl: './drawer.html',
  styleUrl: './drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiDrawer {
  readonly heading = input.required<string>();
  readonly visible = model(false);
  readonly width = input('22rem');
  readonly closed = output<void>();

  protected readonly headingId = `ui-drawer-heading-${nextId++}`;
  /** PrimeNG renders the panel as `complementary`; it behaves as a modal dialog. */
  protected readonly passThrough = {
    root: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': this.headingId },
  };
}
