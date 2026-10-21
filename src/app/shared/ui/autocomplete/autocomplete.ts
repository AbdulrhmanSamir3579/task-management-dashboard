import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  computed,
  contentChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoComplete } from 'primeng/autocomplete';

/**
 * Template for one suggestion:
 * `<ng-template uiAutocompleteItem [uiAutocompleteItemOf]="items" let-item>`.
 * `uiAutocompleteItemOf` is only there so the template knows the item type.
 */
@Directive({ selector: 'ng-template[uiAutocompleteItem]' })
export class UiAutocompleteItem<T> {
  readonly template = inject<TemplateRef<{ $implicit: T }>>(TemplateRef);
  readonly uiAutocompleteItemOf = input<readonly T[]>();

  static ngTemplateContextGuard<T>(
    _directive: UiAutocompleteItem<T>,
    _context: unknown,
  ): _context is { $implicit: T } {
    return true;
  }
}

/**
 * Text box with a list of suggestions. It only reports what is typed (`queryChange`),
 * what is chosen (`selected`) and Enter without a choice (`submitted`); debouncing and
 * fetching belong to the caller.
 */
@Component({
  selector: 'ui-autocomplete',
  imports: [AutoComplete, FormsModule, NgTemplateOutlet],
  template: `
    <p-autocomplete
      fluid
      appendTo="body"
      [inputId]="inputId()"
      [placeholder]="placeholder()"
      [ariaLabel]="ariaLabel()"
      [suggestions]="suggestionList()"
      [optionLabel]="optionLabel()"
      [delay]="0"
      [minQueryLength]="1"
      [showEmptyMessage]="true"
      [emptyMessage]="emptyMessage()"
      [ngModel]="value()"
      (ngModelChange)="value.set($event)"
      (completeMethod)="queryChange.emit($event.query)"
      (onSelect)="onSelect($event.value)"
      (onClear)="queryChange.emit('')"
      (keydown.enter)="onEnter($event)"
    >
      <ng-template #item let-item>
        @if (itemTemplate(); as custom) {
          <ng-container
            [ngTemplateOutlet]="custom.template"
            [ngTemplateOutletContext]="{ $implicit: item }"
          />
        } @else {
          {{ item[optionLabel()] }}
        }
      </ng-template>
    </p-autocomplete>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiAutocomplete<T extends object> {
  readonly suggestions = input.required<readonly T[]>();
  /** Property shown in the box once a suggestion is chosen. */
  readonly optionLabel = input.required<keyof T & string>();
  readonly inputId = input<string>();
  readonly placeholder = input('');
  readonly ariaLabel = input<string>();
  /** Shown when there are no suggestions, e.g. "Searching..." or "No results". */
  readonly emptyMessage = input('No results');
  readonly queryChange = output<string>();
  readonly selected = output<T>();
  /** Enter pressed without choosing a suggestion; carries the typed text. */
  readonly submitted = output<string>();

  /** Set while a suggestion is being chosen, so the same Enter does not also submit. */
  private choosing = false;

  protected readonly value = signal<T | string | null>(null);
  protected readonly itemTemplate = contentChild<UiAutocompleteItem<T>>(UiAutocompleteItem);
  protected readonly suggestionList = computed(() => [...this.suggestions()]);

  protected onSelect(item: T): void {
    this.choosing = true;
    queueMicrotask(() => (this.choosing = false));
    this.selected.emit(item);
  }

  protected onEnter(event: Event): void {
    if (!this.choosing) {
      this.submitted.emit((event.target as HTMLInputElement).value);
    }
  }
}
