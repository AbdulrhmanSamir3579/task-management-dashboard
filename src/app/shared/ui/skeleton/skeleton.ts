import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Skeleton } from 'primeng/skeleton';

/** Loading placeholder with the shape of the content it replaces. */
@Component({
  selector: 'ui-skeleton',
  imports: [Skeleton],
  template: `
    <p-skeleton
      [width]="width()"
      [height]="height()"
      [shape]="shape()"
      [borderRadius]="borderRadius()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSkeleton {
  readonly width = input('100%');
  readonly height = input('1rem');
  readonly shape = input<'rectangle' | 'circle'>('rectangle');
  readonly borderRadius = input<string>();
}
