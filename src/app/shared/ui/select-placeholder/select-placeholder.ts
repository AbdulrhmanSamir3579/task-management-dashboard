import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Looks like a closed `ui-select` / `ui-multi-select` while the real one loads, e.g. in
 * a `@defer` placeholder. It uses the same theme sizes, so nothing moves when the real
 * control replaces it. Hidden from assistive technology: it cannot be used.
 */
@Component({
  selector: 'ui-select-placeholder',
  host: { 'aria-hidden': 'true' },
  templateUrl: './select-placeholder.html',
  styleUrl: './select-placeholder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSelectPlaceholder {
  /** The selected value's label, or the select's placeholder. */
  readonly text = input.required<string>();
  /** Shows `text` in the placeholder colour, as when nothing is selected. */
  readonly empty = input(false);
}
