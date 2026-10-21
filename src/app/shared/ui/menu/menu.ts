import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import type { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { UiButton } from '../button/button';
import type { MenuAction } from '../ui.types';

/** Actions menu opened from an icon button, e.g. the "more" button on a task card. */
@Component({
  selector: 'ui-menu',
  imports: [Menu, UiButton],
  template: `
    <ui-button
      variant="ghost"
      size="small"
      [ariaLabel]="triggerLabel()"
      (clicked)="menu.toggle($event)"
    >
      <span aria-hidden="true">⋮</span>
    </ui-button>
    <p-menu #menu appendTo="body" [model]="items()" [popup]="true" [ariaLabel]="triggerLabel()" />
  `,
  // The popup is rendered under <body>, outside this component's style scope.
  encapsulation: ViewEncapsulation.None,
  styles: `
    .ui-menu-item-danger .p-menu-item-label {
      color: var(--p-red-500);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiMenu {
  readonly actions = input.required<MenuAction[]>();
  /** Accessible name of the trigger button and the menu, e.g. "Task actions". */
  readonly triggerLabel = input.required<string>();

  protected readonly items = computed<MenuItem[]>(() =>
    this.actions().map((action) => ({
      label: action.label,
      disabled: action.disabled,
      styleClass: action.tone === 'danger' ? 'ui-menu-item-danger' : undefined,
      command: () => action.command(),
    })),
  );
}
