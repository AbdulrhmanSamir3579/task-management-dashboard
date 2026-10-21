import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { NavItem } from '../navigation';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="sidebar" aria-label="Main">
      <a class="sidebar__brand" routerLink="/dashboard" (click)="navigated.emit()">
        <span aria-hidden="true">📋</span> Task Manager
      </a>
      <ul class="sidebar__list">
        @for (item of items(); track item.path) {
          <li>
            <a
              class="sidebar__link"
              [routerLink]="item.path"
              routerLinkActive="sidebar__link--active"
              ariaCurrentWhenActive="page"
              (click)="navigated.emit()"
            >
              <span class="sidebar__icon" aria-hidden="true">{{ item.icon }}</span>
              {{ item.label }}
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  readonly items = input.required<readonly NavItem[]>();
  /** Emitted when a link is followed, so the mobile drawer can close. */
  readonly navigated = output<void>();
}
