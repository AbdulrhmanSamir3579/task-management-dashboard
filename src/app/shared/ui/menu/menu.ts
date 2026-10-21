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
  styles: `
    .ui-menu__trigger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--app-text-muted);
      cursor: pointer;
      transition:
        background-color 0.15s ease,
        color 0.15s ease;
    }
    .ui-menu__trigger:hover,
    .ui-menu__trigger[aria-expanded='true'] {
      background: rgb(0 0 0 / 6%);
      color: var(--app-text);
    }
    .ui-menu__trigger:focus-visible {
      outline: 2px solid var(--app-primary);
      outline-offset: 2px;
    }
    .ui-menu__icon {
      width: 1.125rem;
      height: 1.125rem;
      fill: currentColor;
    }
    .ui-menu-item-danger .p-menu-item-label {
      color: var(--p-red-500);
    }
    @media (prefers-reduced-motion: reduce) {
      .ui-menu__trigger {
        transition: none;
      }
    }
  `,
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
