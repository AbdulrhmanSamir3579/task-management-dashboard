import { ChangeDetectionStrategy, Component, computed, forwardRef, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { type AbstractControl, type ValidationErrors, Validators } from '@angular/forms';
import { map, startWith, switchMap } from 'rxjs';
import { FORM_FIELD_CONTEXT, type FormFieldContext } from '../forms/form-control';

type MessageFactory = (error: unknown) => string;

const lengthOf = (error: unknown): number =>
  (error as { requiredLength?: number } | null)?.requiredLength ?? 0;

const DEFAULT_MESSAGES: Readonly<Record<string, MessageFactory>> = {
  required: () => 'This field is required.',
  minlength: (error) => `Use at least ${lengthOf(error)} characters.`,
  maxlength: (error) => `Use at most ${lengthOf(error)} characters.`,
  email: () => 'Enter a valid email address.',
};

let nextId = 0;

interface ControlState {
  invalid: boolean;
  touched: boolean;
  errors: ValidationErrors | null;
}

/**
 * Label, hint and validation message around one form control. The control inside picks
 * up the generated id, invalid state and description through `FORM_FIELD_CONTEXT`.
 *
 * Messages resolve in this order: `messages` input, a string returned by the validator
 * (e.g. `{ dueDateInPast: 'Pick a future date.' }`), the defaults above, a generic text.
 */
@Component({
  selector: 'ui-form-field',
  providers: [{ provide: FORM_FIELD_CONTEXT, useExisting: forwardRef(() => UiFormField) }],
  template: `
    <div class="form-field">
      <label class="form-field__label" [for]="controlId">
        {{ label() }}
        @if (isRequired()) {
          <span class="form-field__required" aria-hidden="true">*</span>
        }
      </label>
      <ng-content />
      @if (invalid()) {
        <small class="form-field__error" [id]="errorId" role="alert">{{ errorMessage() }}</small>
      } @else if (hint()) {
        <small class="form-field__hint" [id]="hintId">{{ hint() }}</small>
      }
    </div>
  `,
  styles: `
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    .form-field__label {
      font-weight: 600;
    }
    .form-field__required,
    .form-field__error {
      color: var(--p-red-500);
    }
    .form-field__hint {
      color: var(--p-text-muted-color);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFormField implements FormFieldContext {
  readonly label = input.required<string>();
  readonly control = input.required<AbstractControl>();
  readonly hint = input<string>();
  /** Overrides per error key, e.g. `{ required: 'Give the task a title.' }`. */
  readonly messages = input<Readonly<Record<string, string>>>({});

  readonly controlId = `ui-field-${nextId++}`;
  protected readonly errorId = `${this.controlId}-error`;
  protected readonly hintId = `${this.controlId}-hint`;

  private readonly state = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) =>
        control.events.pipe(
          startWith(null),
          map((): ControlState => ({
            invalid: control.invalid,
            touched: control.touched,
            errors: control.errors,
          })),
        ),
      ),
    ),
    { initialValue: { invalid: false, touched: false, errors: null } },
  );

  /** Errors are shown only after the user has interacted with the field. */
  readonly invalid = computed(() => this.state().invalid && this.state().touched);
  readonly describedBy = computed(() =>
    this.invalid() ? this.errorId : this.hint() ? this.hintId : undefined,
  );

  protected readonly isRequired = computed(() => this.control().hasValidator(Validators.required));
  protected readonly errorMessage = computed(() => {
    const [key, error] = Object.entries(this.state().errors ?? {})[0] ?? [];
    if (key === undefined) {
      return '';
    }
    return (
      this.messages()[key] ??
      (typeof error === 'string' ? error : undefined) ??
      DEFAULT_MESSAGES[key]?.(error) ??
      'Enter a valid value.'
    );
  });
}
