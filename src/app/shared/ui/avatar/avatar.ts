import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Avatar } from 'primeng/avatar';
import type { ControlSize } from '../ui.types';

const SIZE = { small: 'normal', medium: 'large', large: 'xlarge' } as const satisfies Record<
  ControlSize,
  string
>;

@Component({
  selector: 'ui-avatar',
  imports: [Avatar],
  template: `
    <p-avatar [label]="initials()" [size]="primeSize()" shape="circle" [ariaLabel]="name()" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiAvatar {
  /** Short text shown inside the avatar, e.g. "JD". */
  readonly initials = input.required<string>();
  /** Full name read by screen readers. */
  readonly name = input.required<string>();
  readonly size = input<ControlSize>('small');

  protected readonly primeSize = computed(() => SIZE[this.size()]);
}
