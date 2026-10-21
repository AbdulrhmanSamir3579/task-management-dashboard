import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiAvatar } from '../../../shared/ui/avatar/avatar';

@Component({
  selector: 'app-header',
  imports: [UiAvatar],
  template: `
    <header class="header">
      <button
        type="button"
        class="header__menu"
        aria-controls="app-sidebar"
        [attr.aria-expanded]="menuOpen()"
        [attr.aria-label]="menuOpen() ? 'Close navigation' : 'Open navigation'"
        (click)="menuToggle.emit()"
      >
        <span aria-hidden="true">☰</span>
      </button>
      <h1 class="header__title">{{ title() }}</h1>
      <div class="header__actions">
        <ui-avatar initials="ME" name="Your profile" />
      </div>
    </header>
  `,
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly title = input.required<string>();
  /** Whether the mobile navigation drawer is open. */
  readonly menuOpen = input(false);
  readonly menuToggle = output<void>();
}
