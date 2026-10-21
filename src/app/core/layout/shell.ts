import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { UiConfirmOutlet } from '../../shared/ui/confirm/confirm-outlet';
import { UiToastOutlet } from '../../shared/ui/notifications/toast-outlet';
import { GlobalSearch } from './global-search/global-search';
import { Header } from './header/header';
import { NAVIGATION } from './navigation';
import { Sidebar } from './sidebar/sidebar';

/** Layout around every page: sidebar, header, routed content and the overlay outlets. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Header, GlobalSearch, UiToastOutlet, UiConfirmOutlet],
  host: { '(document:keydown.escape)': 'closeNav()' },
  template: `
    <a class="skip-link" href="#main-content" (click)="skipToContent($event)">
      Skip to main content
    </a>
    <app-header [menuOpen]="navOpen()" (menuToggle)="toggleNav()">
      <app-global-search />
    </app-header>
    <div class="shell" [class.shell--nav-open]="navOpen()">
      <app-sidebar
        id="app-sidebar"
        class="shell__sidebar"
        [items]="navigation"
        (navigated)="closeNav()"
      />
      @if (navOpen()) {
        <button
          type="button"
          class="shell__backdrop"
          aria-label="Close navigation"
          (click)="closeNav()"
        ></button>
      }
      <main #main id="main-content" class="shell__main" tabindex="-1">
        <!-- The design has no visible page title; screen readers still get one. -->
        <h1 class="visually-hidden">{{ pageTitle() }}</h1>
        <router-outlet />
      </main>
    </div>
    <!-- Loaded right after first paint to keep PrimeNG's overlays out of the initial bundle. -->
    @defer (on idle) {
      <ui-toast-outlet />
      <ui-confirm-outlet />
    }
  `,
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly router = inject(Router);
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  protected readonly navigation = NAVIGATION;
  /** Mobile navigation drawer; the sidebar is always visible on wide screens. */
  protected readonly navOpen = signal(false);
  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.activeTitle()),
    ),
    { initialValue: this.activeTitle() },
  );

  protected toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  protected closeNav(): void {
    this.navOpen.set(false);
  }

  protected skipToContent(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }

  /** Title of the deepest active route, as set by the `title` of its route config. */
  private activeTitle(): string {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.title ?? '';
  }
}
