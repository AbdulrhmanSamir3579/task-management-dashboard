import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Button } from 'primeng/button';
import type { ButtonVariant, ControlSize } from '../ui.types';

const SEVERITY = {
  primary: 'primary',
  secondary: 'secondary',
  danger: 'danger',
  ghost: 'secondary',
} as const satisfies Record<ButtonVariant, string>;

const SIZE = { small: 'small', medium: undefined, large: 'large' } as const satisfies Record<
  ControlSize,
  string | undefined
>;

@Component({
  selector: 'ui-button',
  imports: [Button],
  template: `
    <p-button
      [label]="label()"
      [type]="type()"
      [severity]="severity()"
      [variant]="variant() === 'ghost' ? 'text' : undefined"
      [size]="primeSize()"
      [loading]="loading()"
      [disabled]="disabled()"
      [fluid]="fullWidth()"
      [ariaLabel]="ariaLabel()"
      (onClick)="clicked.emit($event)"
    >
      <ng-content />
    </p-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiButton {
  readonly label = input<string>();
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ControlSize>('medium');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly fullWidth = input(false);
  /** Required when the button has no visible label, e.g. icon-only buttons. */
  readonly ariaLabel = input<string>();
  readonly clicked = output<MouseEvent>();

  protected readonly severity = computed(() => SEVERITY[this.variant()]);
  protected readonly primeSize = computed(() => SIZE[this.size()]);
}
