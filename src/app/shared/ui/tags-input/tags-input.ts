import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Chip } from 'primeng/chip';
import { InputText } from 'primeng/inputtext';
import { UiFormControl, provideValueAccessor } from '../forms/form-control';

/**
 * Free-text tags. Enter or comma adds the typed tag, Backspace on an empty input removes
 * the last one, and leaving the field keeps whatever was typed. Duplicates are ignored.
 */
@Component({
  selector: 'ui-tags-input',
  imports: [Chip, InputText],
  providers: [provideValueAccessor(() => UiTagsInput)],
  template: `
    <div class="tags-input">
      @if (tags().length) {
        <ul class="tags-input__list" [attr.aria-label]="listLabel()">
          @for (tag of tags(); track tag) {
            <li class="tags-input__item">
              <p-chip [label]="tag" />
              <button
                type="button"
                class="tags-input__remove"
                [attr.aria-label]="'Remove ' + tag"
                [disabled]="disabled()"
                (click)="remove(tag)"
              >
                ×
              </button>
            </li>
          }
        </ul>
      }
      <input
        #field
        pInputText
        fluid
        [id]="controlId()"
        [placeholder]="isFull() ? '' : placeholder()"
        [disabled]="disabled() || isFull()"
        [invalid]="isInvalid()"
        [attr.aria-invalid]="isInvalid() || null"
        [attr.aria-describedby]="describedBy() || null"
        (keydown)="onKeydown($event, field)"
        (blur)="onBlur(field)"
      />
    </div>
  `,
  styles: `
    .tags-input {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .tags-input__list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .tags-input__item {
      display: inline-flex;
      align-items: center;
    }
    .tags-input__remove {
      margin-inline-start: -1.75rem;
      padding: 0 0.5rem;
      border: 0;
      background: none;
      color: inherit;
      cursor: pointer;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTagsInput extends UiFormControl<string[]> {
  readonly placeholder = input('');
  /** Maximum number of tags; the input is disabled once reached. */
  readonly max = input<number>();
  readonly listLabel = input('Tags');

  protected readonly emptyValue: string[] = [];
  protected readonly tags = computed(() => this.value() ?? []);
  protected readonly isFull = computed(() => {
    const max = this.max();
    return max !== undefined && this.tags().length >= max;
  });

  protected onKeydown(event: KeyboardEvent, field: HTMLInputElement): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.add(field);
    } else if (event.key === 'Backspace' && !field.value) {
      const last = this.tags().at(-1);
      if (last) {
        this.remove(last);
      }
    }
  }

  protected onBlur(field: HTMLInputElement): void {
    this.add(field);
    this.markTouched();
  }

  protected remove(tag: string): void {
    this.updateValue(this.tags().filter((existing) => existing !== tag));
  }

  private add(field: HTMLInputElement): void {
    const tag = field.value.trim();
    field.value = '';
    const isDuplicate = this.tags().some(
      (existing) => existing.toLowerCase() === tag.toLowerCase(),
    );
    if (tag && !isDuplicate && !this.isFull()) {
      this.updateValue([...this.tags(), tag]);
    }
  }
}
