import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { UiFormControl, provideValueAccessor } from '../forms/form-control';
import type { SelectOption } from '../ui.types';

@Component({
  selector: 'ui-select',
  imports: [Select, FormsModule],
  providers: [provideValueAccessor(() => UiSelect)],
  template: `
    <p-select
      fluid
      appendTo="body"
      optionLabel="label"
      optionValue="value"
      optionDisabled="disabled"
      [inputId]="controlId()"
      [options]="options()"
      [placeholder]="placeholder()"
      [showClear]="clearable()"
      [filter]="searchable()"
      [invalid]="isInvalid()"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="labelledBy()"
      [disabled]="disabled()"
      [ngModel]="value()"
      (ngModelChange)="updateValue($event)"
      (onBlur)="markTouched()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSelect<T> extends UiFormControl<T | null> {
  readonly options = input.required<SelectOption<T>[]>();
  readonly placeholder = input('');
  readonly clearable = input(false);
  readonly searchable = input(false);
  readonly ariaLabel = input<string>();

  protected readonly emptyValue = null;
}
