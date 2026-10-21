import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { InputText } from 'primeng/inputtext';
import { UiFormControl, provideValueAccessor } from '../forms/form-control';

/**
 * Free-text tags. Enter or comma adds the typed tag, Backspace on an empty input removes
 * the last one, and leaving the field keeps whatever was typed. Duplicates are ignored.
 */
@Component({
  selector: 'ui-tags-input',
  imports: [InputText],
  providers: [provideValueAccessor(() => UiTagsInput)],
  templateUrl: './tags-input.html',
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
    .tags-input__chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      max-width: 100%;
      padding: 0.25rem 0.25rem 0.25rem 0.75rem;
      border-radius: 1rem;
      background: var(--p-chip-background, var(--app-background));
      color: var(--p-chip-color, var(--app-text));
      font-size: 0.8125rem;
      line-height: 1.25rem;
    }
    .tags-input__label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tags-input__remove {
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 1.25rem;
      height: 1.25rem;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: none;
      color: var(--app-text-muted);
      font-size: 0.625rem;
      cursor: pointer;

      &:hover:not(:disabled) {
        background: rgb(0 0 0 / 8%);
        color: var(--app-text);
      }

      &:focus-visible {
        outline: 2px solid var(--app-primary);
        outline-offset: 1px;
      }

      &:disabled {
        cursor: default;
        opacity: 0.5;
      }
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
