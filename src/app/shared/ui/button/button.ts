import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Button } from 'primeng/button';
import type { ButtonVariant, ControlSize } from '../ui.types';

const SEVERITY = {
  primary: 'primary',
  secondary: 'secondary',
  outline: 'secondary',
  danger: 'danger',
  ghost: 'secondary',
} as const satisfies Record<ButtonVariant, string>;

const PRIME_VARIANT = {
  primary: undefined,
  secondary: undefined,
  outline: 'outlined',
  danger: undefined,
  ghost: 'text',
} as const satisfies Record<ButtonVariant, string | undefined>;

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
      [variant]="primeVariant()"
      [size]="primeSize()"
      [loading]="loading()"
      [disabled]="disabled()"
      [fluid]="fullWidth()"
      [autofocus]="autofocus()"
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
  /** Focuses the button once it is shown, e.g. the safe choice in a dialog. */
  readonly autofocus = input(false);
  /** Required when the button has no visible label, e.g. icon-only buttons. */
  readonly ariaLabel = input<string>();
  readonly clicked = output<MouseEvent>();

  protected readonly severity = computed(() => SEVERITY[this.variant()]);
  protected readonly primeVariant = computed(() => PRIME_VARIANT[this.variant()]);
  protected readonly primeSize = computed(() => SIZE[this.size()]);
}
