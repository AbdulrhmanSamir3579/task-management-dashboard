import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { InputText } from 'primeng/inputtext';
import { UiFormControl, provideValueAccessor } from '../forms/form-control';

@Component({
  selector: 'ui-input-text',
  imports: [InputText],
  providers: [provideValueAccessor(() => UiInputText)],
  template: `
    <input
      pInputText
      fluid
      [id]="controlId()"
      [type]="type()"
      [placeholder]="placeholder()"
      [value]="value()"
      [disabled]="disabled()"
      [invalid]="isInvalid()"
      [attr.aria-invalid]="isInvalid() || null"
      [attr.aria-describedby]="describedBy() || null"
      [attr.maxlength]="maxLength() ?? null"
      (input)="onInput($event)"
      (blur)="markTouched()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiInputText extends UiFormControl<string> {
  readonly type = input<'text' | 'email' | 'search' | 'url'>('text');
  readonly placeholder = input('');
  readonly maxLength = input<number>();

  protected readonly emptyValue = '';

  protected onInput(event: Event): void {
    this.updateValue((event.target as HTMLInputElement).value);
  }
}
