import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MultiSelect } from 'primeng/multiselect';
import { UiFormControl, provideValueAccessor } from '../forms/form-control';
import type { SelectOption } from '../ui.types';

@Component({
  selector: 'ui-multi-select',
  imports: [MultiSelect, FormsModule],
  providers: [provideValueAccessor(() => UiMultiSelect)],
  template: `
    <p-multiselect
      fluid
      display="chip"
      appendTo="body"
      optionLabel="label"
      optionValue="value"
      optionDisabled="disabled"
      [inputId]="controlId()"
      [options]="options()"
      [placeholder]="placeholder()"
      [filter]="searchable()"
      [showToggleAll]="false"
      [invalid]="isInvalid()"
      [ariaLabel]="ariaLabel()"
      [disabled]="disabled()"
      [ngModel]="value()"
      (ngModelChange)="updateValue($event ?? [])"
      (onBlur)="markTouched()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiMultiSelect<T> extends UiFormControl<T[]> {
  readonly options = input.required<SelectOption<T>[]>();
  readonly placeholder = input('');
  readonly searchable = input(false);
  readonly ariaLabel = input<string>();

  protected readonly emptyValue: T[] = [];
}
