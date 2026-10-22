import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  Injector,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Popover } from 'primeng/popover';

/**
 * Panel anchored to the button that opens it, e.g. the notifications list:
 * `<button (click)="panel.toggle($event)" [attr.aria-expanded]="panel.isOpen()">` and
 * `<ui-popover #panel label="Notifications">`. Escape and a click outside close it, and
 * focus goes back to the button.
 */
@Component({
  selector: 'ui-popover',
  imports: [Popover],
  template: `
    <p-popover
      appendTo="body"
      [ariaLabel]="label()"
      [style]="flush() ? flushStyle : {}"
      (onShow)="onShow()"
      (onHide)="onHide()"
    >
      <ng-content />
    </p-popover>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiPopover {
  /** Accessible name of the panel. */
  readonly label = input.required<string>();
  /** Removes the inner padding, for content with its own, e.g. a list running edge to edge. */
  readonly flush = input(false);
  readonly opened = output<void>();
  readonly closed = output<void>();

  /** For the trigger's `aria-expanded`. */
  readonly isOpen = signal(false);

  protected readonly flushStyle = { '--p-popover-content-padding': '0' };

  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly popover = viewChild.required(Popover);
  private trigger: HTMLElement | null = null;

  toggle(event: Event): void {
    this.trigger = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
    this.popover().toggle(event);
  }

  hide(): void {
    this.popover().hide();
  }

  protected onShow(): void {
    this.isOpen.set(true);
    this.opened.emit();
  }

  protected onHide(): void {
    this.isOpen.set(false);
    this.closed.emit();
    // Closed with focus inside (Escape, a button in the panel): once the panel is removed,
    // focus would fall back to the page. A click elsewhere keeps its own focus.
    afterNextRender(
      () => {
        const active = this.document.activeElement;
        if (!active || active === this.document.body) {
          this.trigger?.focus();
        }
      },
      { injector: this.injector },
    );
  }
}
