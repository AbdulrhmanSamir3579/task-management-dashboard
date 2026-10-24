import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  ViewEncapsulation,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import type { MenuAction } from '../ui.types';

/** The part of PrimeNG's menu used here. Not typed as `Menu`, so its code can load lazily. */
interface PopupMenu {
  show(event: Event): void;
  toggle(event: Event): void;
}

/**
 * Actions menu opened from an icon button, e.g. the "more" button on a task card. With
 * `trigger="content"`, the projected content is the button instead, e.g. a priority chip.
 * The PrimeNG menu is only created the first time it is opened: a board shows one button
 * per card, and creating every menu up front cost noticeable start-up time. Its code is
 * not part of the page either: it downloads once the browser is idle.
 */
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
  /** `icon` shows a "more" icon; `content` turns the projected content into the button. */
  readonly trigger = input<'icon' | 'content'>('icon');

  protected readonly open = signal(false);
  protected readonly rendered = signal(false);

  private readonly menu = viewChild<PopupMenu>('popup');
  private readonly injector = inject(Injector);
  /** Where to open the menu once it has loaded, after the first click. */
  private pendingAnchor: Event | null = null;

  constructor() {
    effect(() => {
      const menu = this.menu();
      const anchor = this.pendingAnchor;
      if (menu && anchor) {
        this.pendingAnchor = null;
        afterNextRender(() => menu.show(anchor), { injector: this.injector });
      }
    });
  }

  protected readonly items = computed<MenuItem[]>(() =>
    this.actions().map((action) => ({
      label: action.label,
      disabled: action.disabled,
      styleClass: action.tone === 'danger' ? 'ui-menu-item-danger' : undefined,
      command: () => action.command(),
    })),
  );

  protected toggle(event: MouseEvent): void {
    // PrimeNG anchors the popup to `currentTarget`, which is gone once the click is over.
    const anchor = { currentTarget: event.currentTarget } as unknown as Event;
    const menu = this.menu();
    if (menu) {
      menu.toggle(anchor);
      return;
    }
    this.pendingAnchor = anchor;
    this.rendered.set(true);
  }
}
