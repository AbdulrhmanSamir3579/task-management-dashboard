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
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly message = input<string>();
  readonly icon = input('📭');
}
