import {
  Directive,
  InjectionToken,
  type Provider,
  type Signal,
  type Type,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** What a surrounding `ui-form-field` shares with the control inside it. */
export interface FormFieldContext {
  controlId: string;
  describedBy: Signal<string | undefined>;
  invalid: Signal<boolean>;
}

export const FORM_FIELD_CONTEXT = new InjectionToken<FormFieldContext>('FORM_FIELD_CONTEXT');

/** Registers a wrapper as the value accessor of `formControlName` / `formControl`. */
export function provideValueAccessor(component: () => Type<unknown>): Provider {
  return { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(component), multi: true };
}

/**
 * Shared Reactive Forms plumbing for the form wrappers. The form writes into `value`;
 * the wrapper reports edits with `updateValue()` and blur with `markTouched()`.
 * Id, invalid state and description come from the inputs or from a surrounding
 * `ui-form-field`, so labels and error messages are linked for screen readers.
 */
@Directive()
export abstract class UiFormControl<T> implements ControlValueAccessor {
  private readonly field = inject(FORM_FIELD_CONTEXT, { optional: true });
  private onChange: (value: T) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  readonly inputId = input<string>();
  readonly invalid = input(false);

  protected abstract readonly emptyValue: T;
  protected readonly value = signal<T | null>(null);
  protected readonly disabled = signal(false);

  protected readonly controlId = computed(() => this.inputId() ?? this.field?.controlId);
  protected readonly isInvalid = computed(() => this.invalid() || (this.field?.invalid() ?? false));
  protected readonly describedBy = computed(() => this.field?.describedBy());

  writeValue(value: T | null): void {
    this.value.set(value ?? this.emptyValue);
  }

  registerOnChange(fn: (value: T) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected updateValue(value: T): void {
    this.value.set(value);
    this.onChange(value);
  }

  protected markTouched(): void {
    this.onTouched();
  }
}
