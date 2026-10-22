import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Checkbox } from 'primeng/checkbox';
import { UiFormControl, provideValueAccessor } from '../forms/form-control';

let nextId = 0;

/** A single yes/no checkbox. Give it a visible `label` or, without one, an `ariaLabel`. */
@Component({
  selector: 'ui-checkbox',
  imports: [Checkbox, FormsModule],
  providers: [provideValueAccessor(() => UiCheckbox)],
  template: `
    <p-checkbox
      [binary]="true"
      [inputId]="id()"
      [ariaLabel]="label() ? undefined : ariaLabel()"
      [invalid]="isInvalid()"
      [disabled]="disabled()"
      [ngModel]="value()"
      (ngModelChange)="updateValue($event === true)"
      (onBlur)="markTouched()"
    />
    @if (label(); as text) {
      <label class="ui-checkbox__label" [for]="id()">{{ text }}</label>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiCheckbox extends UiFormControl<boolean> {
  readonly label = input<string>();
  readonly ariaLabel = input<string>();

  protected readonly emptyValue = false;
  private readonly fallbackId = `ui-checkbox-${nextId++}`;
  protected readonly id = computed(() => this.controlId() ?? this.fallbackId);
}
