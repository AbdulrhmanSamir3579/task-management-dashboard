import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { fromIsoDate, toIsoDate } from '../../utils/date.utils';
import { UiFormControl, provideValueAccessor } from '../forms/form-control';

/** Date picker whose value is a `YYYY-MM-DD` string, the format used by the API. */
@Component({
  selector: 'ui-date-picker',
  imports: [DatePicker, FormsModule],
  providers: [provideValueAccessor(() => UiDatePicker)],
  template: `
    <p-datepicker
      fluid
      showIcon
      iconDisplay="input"
      appendTo="body"
      dateFormat="M d, yy"
      [inputId]="controlId()"
      [minDate]="minDateValue()"
      [placeholder]="placeholder()"
      [showClear]="clearable()"
      [invalid]="isInvalid()"
      [ariaLabel]="ariaLabel()"
      [disabled]="disabled()"
      [ngModel]="dateValue()"
      (ngModelChange)="onDateChange($event)"
      (onBlur)="markTouched()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiDatePicker extends UiFormControl<string | null> {
  /** Earliest selectable day, `YYYY-MM-DD`. */
  readonly minDate = input<string>();
  readonly placeholder = input('');
  readonly clearable = input(false);
  readonly ariaLabel = input<string>();

  protected readonly emptyValue = null;
  protected readonly dateValue = computed(() => {
    const value = this.value();
    return value ? fromIsoDate(value) : null;
  });
  protected readonly minDateValue = computed(() => {
    const minDate = this.minDate();
    return minDate ? fromIsoDate(minDate) : null;
  });

  protected onDateChange(date: Date | null): void {
    this.updateValue(date ? toIsoDate(date) : null);
  }
}
