import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Avatar } from 'primeng/avatar';
import type { ControlSize } from '../ui.types';

const DIMENSIONS = {
  small: { box: '1.5rem', font: '0.625rem' },
  medium: { box: '2rem', font: '0.8125rem' },
  large: { box: '2.5rem', font: '1rem' },
} as const satisfies Record<ControlSize, { box: string; font: string }>;

/** Round avatar with initials. Sizes match the design: 24px on cards, 40px in the header. */
@Component({
  selector: 'ui-avatar',
  imports: [Avatar],
  host: {
    '[style.--p-avatar-width]': 'dimensions().box',
    '[style.--p-avatar-height]': 'dimensions().box',
    '[style.--p-avatar-font-size]': 'dimensions().font',
  },
  template: `<p-avatar [label]="initials()" shape="circle" [ariaLabel]="name()" />`,
  styles: `
    :host {
      display: inline-flex;
      --p-avatar-font-weight: 700;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiAvatar {
  /** Short text shown inside the avatar, e.g. "JD". */
  readonly initials = input.required<string>();
  /** Full name read by screen readers. */
  readonly name = input.required<string>();
  readonly size = input<ControlSize>('small');

  protected readonly dimensions = computed(() => DIMENSIONS[this.size()]);
}
