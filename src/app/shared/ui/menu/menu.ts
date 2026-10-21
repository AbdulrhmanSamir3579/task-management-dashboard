import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  signal,
} from '@angular/core';
import type { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import type { MenuAction } from '../ui.types';

/** Actions menu opened from an icon button, e.g. the "more" button on a task card. */
@Component({
  selector: 'ui-menu',
  imports: [Menu],
  templateUrl: './menu.html',
  // The popup is rendered under <body>, outside this component's style scope, so the
  // styles are global and use component-specific class names.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiMenu {
  readonly actions = input.required<MenuAction[]>();
  /** Accessible name of the trigger button and the menu, e.g. "Task actions". */
  readonly triggerLabel = input.required<string>();

  protected readonly open = signal(false);

  protected readonly items = computed<MenuItem[]>(() =>
    this.actions().map((action) => ({
      label: action.label,
      disabled: action.disabled,
      styleClass: action.tone === 'danger' ? 'ui-menu-item-danger' : undefined,
      command: () => action.command(),
    })),
  );
}
