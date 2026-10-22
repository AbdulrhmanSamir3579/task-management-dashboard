import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../../core/i18n/language.service';
import { UiButton } from '../../../shared/ui/button/button';
import { UiPopover } from '../../../shared/ui/popover/popover';
import { UiSkeleton } from '../../../shared/ui/skeleton/skeleton';
import { ActivityList } from '../components/activity-list/activity-list';
import { ActivityStore } from '../data-access/activity.store';

/** The header's 🔔: unread count on the button, recent activity in a panel. */
@Component({
  selector: 'app-activity-bell',
  imports: [ActivityList, TranslatePipe, UiButton, UiPopover, UiSkeleton],
  templateUrl: './activity-bell.html',
  styleUrl: './activity-bell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityBell {
  protected readonly store = inject(ActivityStore);
  private readonly language = inject(LanguageService);

  protected readonly skeletonRows = [0, 1, 2];
  protected readonly now = signal(new Date());
  /** What was seen before the panel opened, so new entries stay marked while it is open. */
  protected readonly newSince = signal<string | null>(null);

  protected readonly badge = computed(() => {
    const count = this.store.unreadCount();
    return count > 9 ? '9+' : String(count);
  });
  protected readonly buttonLabel = computed(() => {
    const count = this.store.unreadCount();
    return count
      ? this.language.t('ACTIVITY.NOTIFICATIONS_UNREAD', { count })
      : this.language.t('ACTIVITY.NOTIFICATIONS');
  });

  protected onOpened(): void {
    this.newSince.set(this.store.lastSeenAt());
    this.now.set(new Date());
    this.store.reload();
    this.store.markAllSeen();
  }
}
