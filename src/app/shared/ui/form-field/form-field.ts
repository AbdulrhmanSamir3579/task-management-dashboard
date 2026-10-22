import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { type AbstractControl, type ValidationErrors, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { map, startWith, switchMap } from 'rxjs';
import { FORM_FIELD_CONTEXT, type FormFieldContext } from '../forms/form-control';

/** What a custom validator puts in its error: a translation key and its parameters. */
export interface ValidationMessage {
  key: string;
  params?: Record<string, unknown>;
}

const lengthOf = (error: unknown): number =>
  (error as { requiredLength?: number } | null)?.requiredLength ?? 0;

const DEFAULT_MESSAGES: Readonly<Record<string, (error: unknown) => ValidationMessage>> = {
  required: () => ({ key: 'VALIDATION.REQUIRED' }),
  minlength: (error) => ({ key: 'VALIDATION.MIN_LENGTH', params: { count: lengthOf(error) } }),
  maxlength: (error) => ({ key: 'VALIDATION.MAX_LENGTH', params: { count: lengthOf(error) } }),
  email: () => ({ key: 'VALIDATION.EMAIL' }),
};

const isValidationMessage = (error: unknown): error is ValidationMessage =>
  typeof (error as ValidationMessage | null)?.key === 'string';

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
 * Messages are translation keys, resolved in this order: the `messages` input, the
 * `{ key, params }` a validator returned, the defaults above, then a generic message.
 * They follow language changes.
 */
@Component({
  selector: 'ui-form-field',
  providers: [{ provide: FORM_FIELD_CONTEXT, useExisting: forwardRef(() => UiFormField) }],
  template: `
    <div class="form-field">
      <label
        class="form-field__label"
        [class.visually-hidden]="!labelVisible()"
        [id]="labelId"
        [for]="controlId"
      >
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
      color: var(--app-danger-text);
    }
    .form-field__hint {
      color: var(--app-text-muted);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFormField implements FormFieldContext {
  readonly label = input.required<string>();
  readonly control = input.required<AbstractControl>();
  readonly hint = input<string>();
  /** Hide the label visually (e.g. in repeated rows) while keeping it for screen readers. */
  readonly labelVisible = input(true);
  /** Translation keys per error, e.g. `{ required: 'TASK_FORM.ASSIGNEE_REQUIRED' }`. */
  readonly messages = input<Readonly<Record<string, string>>>({});

  readonly controlId = `ui-field-${nextId++}`;
  readonly labelId = `${this.controlId}-label`;
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

  private readonly translate = inject(TranslateService);

  protected readonly isRequired = computed(() => this.control().hasValidator(Validators.required));
  protected readonly errorMessage = computed(() => {
    // Read so the message is translated again when the language changes.
    this.translate.currentLang();
    const [errorKey, error] = Object.entries(this.state().errors ?? {})[0] ?? [];
    if (errorKey === undefined) {
      return '';
    }
    const custom = this.messages()[errorKey];
    const message: ValidationMessage = custom
      ? { key: custom }
      : isValidationMessage(error)
        ? error
        : (DEFAULT_MESSAGES[errorKey]?.(error) ?? { key: 'VALIDATION.INVALID' });
    return this.translate.instant(message.key, message.params) as string;
  });
}
