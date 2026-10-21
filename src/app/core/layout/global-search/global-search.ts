import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UiInputText } from '../../../shared/ui/input-text/input-text';

/** Header search: submitting opens the Tasks page filtered by the query. */
@Component({
  selector: 'app-global-search',
  imports: [ReactiveFormsModule, UiInputText],
  template: `
    <form role="search" (submit)="search($event)">
      <label for="global-search" class="visually-hidden">Search tasks</label>
      <ui-input-text
        inputId="global-search"
        type="search"
        placeholder="🔍 Search tasks..."
        [formControl]="query"
      />
    </form>
  `,
  styles: `
    :host {
      display: block;
      --p-inputtext-padding-y: 0.5rem;
      --p-inputtext-padding-x: 1rem;
      --p-inputtext-font-size: 0.8125rem;
      --p-inputtext-border-radius: var(--app-radius-sm);
      --p-inputtext-border-color: var(--app-border);
      --p-inputtext-placeholder-color: var(--app-text-muted);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSearch {
  private readonly router = inject(Router);

  protected readonly query = new FormControl('', { nonNullable: true });

  protected search(event: Event): void {
    event.preventDefault();
    const q = this.query.value.trim();
    void this.router.navigate(['/tasks'], { queryParams: { q: q || null } });
  }
}
