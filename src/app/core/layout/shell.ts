import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { UiConfirmOutlet } from '../../shared/ui/confirm/confirm-outlet';
import { UiToastOutlet } from '../../shared/ui/notifications/toast-outlet';
import { Header } from './header/header';
import { NAVIGATION } from './navigation';
import { Sidebar } from './sidebar/sidebar';

/** Layout around every page: sidebar, header, routed content and the overlay outlets. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Header, UiToastOutlet, UiConfirmOutlet],
  template: `
    <div class="shell">
      <app-sidebar class="shell__sidebar" [items]="navigation" />
      <div class="shell__body">
        <app-header [title]="pageTitle()" />
        <main id="main-content" class="shell__main" tabindex="-1">
          <router-outlet />
        </main>
      </div>
    </div>
    <ui-toast-outlet />
    <ui-confirm-outlet />
  `,
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly router = inject(Router);

  protected readonly navigation = NAVIGATION;
  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.activeTitle()),
    ),
    { initialValue: this.activeTitle() },
  );

  /** Title of the deepest active route, as set by the `title` of its route config. */
  private activeTitle(): string {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.title ?? '';
  }
}
