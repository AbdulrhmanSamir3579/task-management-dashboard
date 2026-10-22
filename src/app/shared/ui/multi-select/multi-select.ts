import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MultiSelect } from 'primeng/multiselect';
import { UiFormControl, provideValueAccessor } from '../forms/form-control';
import type { SelectOption } from '../ui.types';

@Component({
  selector: 'ui-multi-select',
  imports: [MultiSelect, FormsModule],
  providers: [provideValueAccessor(() => UiMultiSelect)],
  templateUrl: './multi-select.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiMultiSelect<T> extends UiFormControl<T[]> {
  readonly options = input.required<SelectOption<T>[]>();
  readonly placeholder = input('');
  readonly searchable = input(false);
  /** One line for toolbars: a single label, or "2 selected", instead of chips. */
  readonly compact = input(false);
  readonly ariaLabel = input<string>();

  protected readonly emptyValue: T[] = [];
}
