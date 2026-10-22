import { type Activity, TASK_STATUS_LABELS } from '../../../../core/models';

/** How an activity reads in the feed: "{actor} {action} {task}{detail}". */
export interface ActivityDescription {
  icon: string;
  action: string;
  /** Text after the task title, e.g. " to Done". */
  detail: string;
}

export function describeActivity(activity: Activity): ActivityDescription {
  switch (activity.type) {
    case 'created':
      return { icon: '➕', action: 'created', detail: '' };
    case 'updated':
      return { icon: '✏️', action: 'updated', detail: '' };
    case 'deleted':
      return { icon: '🗑️', action: 'deleted', detail: '' };
    case 'status_changed':
      return {
        icon: activity.toStatus === 'done' ? '✅' : '🔄',
        action: 'moved',
        detail: activity.toStatus ? ` to ${TASK_STATUS_LABELS[activity.toStatus]}` : '',
      };
  }
}
