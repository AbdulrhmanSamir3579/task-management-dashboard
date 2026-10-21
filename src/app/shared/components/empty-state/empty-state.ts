import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Centered message for empty lists, errors and pages without content yet. */
@Component({
  selector: 'app-empty-state',
  template: `
    <section class="empty-state">
      <span class="empty-state__icon" aria-hidden="true">{{ icon() }}</span>
      <h2 class="empty-state__title">{{ title() }}</h2>
      @if (message()) {
        <p class="empty-state__message">{{ message() }}</p>
      }
      <ng-content />
    </section>
  `,
  styles: `
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 3rem 1rem;
      text-align: center;
    }
    .empty-state__icon {
      font-size: 2.5rem;
    }
    .empty-state__title {
      margin: 0;
      font-size: 1.125rem;
    }
    .empty-state__message {
      margin: 0;
      max-width: 28rem;
      color: var(--p-text-muted-color);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly message = input<string>();
  readonly icon = input('📭');
}
