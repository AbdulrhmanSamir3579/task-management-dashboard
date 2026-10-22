import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { InputText } from 'primeng/inputtext';
import { UiFormControl, provideValueAccessor } from '../forms/form-control';

/**
 * Free-text tags. Enter or comma adds the typed tag, Backspace on an empty input removes
 * the last one, and leaving the field keeps whatever was typed. Duplicates are ignored.
 */
@Component({
  selector: 'ui-tags-input',
  imports: [InputText, TranslatePipe],
  providers: [provideValueAccessor(() => UiTagsInput)],
  templateUrl: './tags-input.html',
  styleUrl: './tags-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTagsInput extends UiFormControl<string[]> {
  readonly placeholder = input('');
  /** Maximum number of tags; the input is disabled once reached. */
  readonly max = input<number>();
  /** Accessible name of the list of tags; a translated "Tags" by default. */
  readonly listLabel = input<string>();

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
