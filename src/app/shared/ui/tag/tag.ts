import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Tag } from 'primeng/tag';
import type { Tone } from '../ui.types';

const SEVERITY = {
  neutral: 'secondary',
  info: 'info',
  success: 'success',
  warning: 'warn',
  danger: 'danger',
} as const satisfies Record<Tone, string>;

@Component({
  selector: 'ui-tag',
  imports: [Tag],
  template: `<p-tag [value]="label()" [severity]="severity()" [rounded]="rounded()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTag {
  readonly label = input.required<string>();
  readonly tone = input<Tone>('neutral');
  readonly rounded = input(false);

  protected readonly severity = computed(() => SEVERITY[this.tone()]);
}
