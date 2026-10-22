import { computed, effect, inject, untracked } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { HttpBaseService } from '../../../core/http/http-base.service';
import { type Activity, CURRENT_USER_ACTOR } from '../../../core/models';
import { LanguageService } from '../../../core/i18n/language.service';
import { BrowserStorage } from '../../../core/storage/browser-storage';
import { TasksStore } from '../../tasks/data-access/tasks.store';

/** How many of the newest entries the feed shows. */
export const ACTIVITY_FEED_LIMIT = 20;

export const LAST_SEEN_STORAGE_KEY = 'task-manager.activity.last-seen';

/**
 * The recent activity feed and how much of it is new. Members starting with `_` are
 * private.
 * - "Seen" is the time of the newest entry when the feed was last opened; it is kept in
 *   the browser, so the unread count survives a reload.
 * - Your own changes never count as unread.
 * - The feed loads again whenever the server accepts a task change, since every change
 *   adds an entry.
 */
export const ActivityStore = signalStore(
  { providedIn: 'root' },
  withState<{ lastSeenAt: string | null }>({ lastSeenAt: null }),
  withProps(() => ({
    _resource: inject(HttpBaseService).resource<Activity[]>(() => ({
      endpoint: 'activities',
      params: { limit: ACTIVITY_FEED_LIMIT },
    })),
    _storage: inject(BrowserStorage),
    _tasks: inject(TasksStore),
    _language: inject(LanguageService),
  })),
  withComputed(({ _resource, lastSeenAt, _language }) => {
    const activities = computed(() => (_resource.hasValue() ? (_resource.value() ?? []) : []));
    return {
      /** Newest first. */
      activities,
      isLoading: computed(() => _resource.isLoading()),
      hasLoaded: computed(() => _resource.hasValue()),
      loadError: computed(() => {
        if (_resource.status() !== 'error') {
          return null;
        }
        return _resource.error()?.message || _language.t('ACTIVITY.LOAD_FAILED');
      }),
      unreadCount: computed(() => {
        const seen = lastSeenAt();
        return activities().filter(
          (activity) =>
            activity.actor !== CURRENT_USER_ACTOR && (seen === null || activity.timestamp > seen),
        ).length;
      }),
    };
  }),
  withMethods((store) => ({
    reload(): void {
      store._resource.reload();
    },
    markAllSeen(): void {
      const newest = store.activities()[0]?.timestamp;
      if (!newest || newest === store.lastSeenAt()) {
        return;
      }
      patchState(store, { lastSeenAt: newest });
      store._storage.set(LAST_SEEN_STORAGE_KEY, newest);
    },
  })),
  withHooks({
    onInit(store) {
      patchState(store, { lastSeenAt: store._storage.get(LAST_SEEN_STORAGE_KEY) });

      let knownChanges = untracked(() => store._tasks.savedChanges());
      effect(() => {
        const saved = store._tasks.savedChanges();
        if (saved !== knownChanges) {
          knownChanges = saved;
          untracked(() => store._resource.reload());
        }
      });
    },
  }),
);
