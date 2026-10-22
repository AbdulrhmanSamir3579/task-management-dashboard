import type { TranslationKey } from '../../../../core/i18n/translation-key';
import { type Activity, CURRENT_USER_ACTOR, TASK_STATUS_KEYS } from '../../../../core/models';

/**
 * How an activity reads in the feed: an icon and a whole-sentence template, so each
 * language can put the actor, task and status in its own word order.
 */
export interface ActivityDescription {
  icon: string;
  /** Template with `{{actor}}`, `{{title}}` and, for moves, `{{status}}`. */
  sentence: TranslationKey;
  /** Translation key of the new status of a moved task. */
  status?: TranslationKey;
}

type Event = 'CREATED' | 'UPDATED' | 'DELETED' | 'MOVED' | 'MOVED_SOMEWHERE';

export function describeActivity(activity: Activity): ActivityDescription {
  const own = activity.actor === CURRENT_USER_ACTOR;
  const sentence = (event: Event): TranslationKey =>
    `ACTIVITY.${own ? 'OWN_EVENT' : 'EVENT'}.${event}` as TranslationKey;

  switch (activity.type) {
    case 'created':
      return { icon: '➕', sentence: sentence('CREATED') };
    case 'updated':
      return { icon: '✏️', sentence: sentence('UPDATED') };
    case 'deleted':
      return { icon: '🗑️', sentence: sentence('DELETED') };
    case 'status_changed':
      return activity.toStatus
        ? {
            icon: activity.toStatus === 'done' ? '✅' : '🔄',
            sentence: sentence('MOVED'),
            status: TASK_STATUS_KEYS[activity.toStatus],
          }
        : { icon: '🔄', sentence: sentence('MOVED_SOMEWHERE') };
  }
}
