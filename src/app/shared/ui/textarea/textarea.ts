import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Textarea } from 'primeng/textarea';
import { UiFormControl, provideValueAccessor } from '../forms/form-control';

/**
 * Multi-line text that grows with its content, never shorter than `rows`.
 *
 * PrimeNG's `autoResize` measures once when the element is created; inside a dialog the
 * element is not on the page yet at that point, so it measured 0 and collapsed. This
 * wrapper measures again whenever the field's width changes (first layout, dialog
 * opening, window resize) and after every change of the value.
 */
@Component({
  selector: 'ui-textarea',
  imports: [Textarea],
  providers: [provideValueAccessor(() => UiTextarea)],
  template: `
    <textarea
      #field
      pTextarea
      fluid
      class="ui-textarea"
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
  styles: `
    .ui-textarea {
      overflow-y: hidden;
      resize: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTextarea extends UiFormControl<string> {
  readonly rows = input(3);
  readonly placeholder = input('');
  readonly maxLength = input<number>();

  protected readonly emptyValue = '';

  private readonly textareaRef = viewChild.required<ElementRef<HTMLTextAreaElement>>('field');

  constructor() {
    super();
    const destroyRef = inject(DestroyRef);
    const injector = inject(Injector);

    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      let lastWidth = 0;
      const observer = new ResizeObserver(([entry]) => {
        const width = entry?.contentRect.width ?? 0;
        if (width !== lastWidth) {
          lastWidth = width;
          this.fit();
        }
      });
      observer.observe(this.textareaRef().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });

    // Values written by the form (e.g. when editing) need a new height too.
    effect(() => {
      this.value();
      afterNextRender(() => this.fit(), { injector });
    });
  }

  protected onInput(event: Event): void {
    this.updateValue((event.target as HTMLTextAreaElement).value);
    this.fit();
  }

  private fit(): void {
    const element = this.textareaRef().nativeElement;
    element.style.height = 'auto';
    if (element.scrollHeight > 0) {
      element.style.height = `${element.scrollHeight}px`;
    }
  }
}
