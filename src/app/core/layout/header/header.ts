import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiAvatar } from '../../../shared/ui/avatar/avatar';

@Component({
  selector: 'app-header',
  imports: [RouterLink, UiAvatar],
  template: `
    <header class="header">
      <div class="header__start">
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
        <a class="header__brand" routerLink="/dashboard">
          <span class="header__logo" aria-hidden="true">📋</span>
          <span class="header__brand-name">Task Manager</span>
        </a>
      </div>
      <div class="header__center">
        <ng-content />
      </div>
      <div class="header__end">
        <ui-avatar initials="JD" name="John Doe" size="large" />
      </div>
    </header>
  `,
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  /** Whether the mobile navigation drawer is open. */
  readonly menuOpen = input(false);
  readonly menuToggle = output<void>();
}
