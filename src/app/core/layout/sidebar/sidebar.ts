import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { NavItem } from '../navigation';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <nav class="sidebar" [attr.aria-label]="'NAV.LABEL' | translate">
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
              {{ item.label | translate }}
            </a>
          </li>
        }
      </ul>
      <ng-content />
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
