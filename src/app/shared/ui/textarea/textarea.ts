import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Textarea } from 'primeng/textarea';
import { UiFormControl, provideValueAccessor } from '../forms/form-control';

@Component({
  selector: 'ui-textarea',
  imports: [Textarea],
  providers: [provideValueAccessor(() => UiTextarea)],
  template: `
    <textarea
      pTextarea
      fluid
      autoResize
      [id]="controlId()"
      [rows]="rows()"
      [placeholder]="placeholder()"
      [value]="value()"
      [disabled]="disabled()"
      [invalid]="isInvalid()"
      [attr.aria-invalid]="isInvalid() || null"
      [attr.aria-describedby]="describedBy() || null"
      [attr.maxlength]="maxLength() ?? null"
      (input)="onInput($event)"
      (blur)="markTouched()"
    ></textarea>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTextarea extends UiFormControl<string> {
  readonly rows = input(3);
  readonly placeholder = input('');
  readonly maxLength = input<number>();

  protected readonly emptyValue = '';

  protected onInput(event: Event): void {
    this.updateValue((event.target as HTMLTextAreaElement).value);
  }
}
