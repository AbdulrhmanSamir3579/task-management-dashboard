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
import { ActivityBell } from '../../features/activity/activity-bell/activity-bell';
import { UiConfirmOutlet } from '../../shared/ui/confirm/confirm-outlet';
import { TaskEditorStore } from '../../features/tasks/data-access/task-editor.store';
import { TaskEditorDialog } from '../../features/tasks/task-editor/task-editor-dialog';
import { TaskSearchBox } from '../../features/tasks/task-search/task-search-box';
import { UiToastOutlet } from '../../shared/ui/notifications/toast-outlet';
import { Header } from './header/header';
import { NAVIGATION } from './navigation';
import { Sidebar } from './sidebar/sidebar';

/** Layout around every page: sidebar, header, routed content and the overlay outlets. */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    Sidebar,
    Header,
    ActivityBell,
    TaskSearchBox,
    TaskEditorDialog,
    UiToastOutlet,
    UiConfirmOutlet,
  ],
  host: { '(document:keydown.escape)': 'closeNav()' },
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly router = inject(Router);
  private readonly taskEditor = inject(TaskEditorStore);
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

  protected newTask(): void {
    this.closeNav();
    this.taskEditor.openCreate();
  }

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
