import { Directive } from '@angular/core';
import { Tooltip } from 'primeng/tooltip';

/** Tooltip on any element: `<button uiTooltip="Edit task" uiTooltipPosition="top">`. */
@Directive({
  selector: '[uiTooltip]',
  hostDirectives: [
    {
      directive: Tooltip,
      inputs: ['pTooltip: uiTooltip', 'tooltipPosition: uiTooltipPosition'],
    },
  ],
})
export class UiTooltip {}
