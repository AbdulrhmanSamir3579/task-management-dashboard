import type { TaskStatus } from './task.model';

/** Actor name the API uses for changes made by the signed-in user. */
export const CURRENT_USER_ACTOR = 'You';

export type ActivityType = 'created' | 'updated' | 'status_changed' | 'deleted';

/** One entry of the recent activity feed. */
export interface Activity {
  id: string;
  type: ActivityType;
  taskId: string;
  taskTitle: string;
  /** Display name of whoever made the change. */
  actor: string;
  timestamp: string;
  fromStatus?: TaskStatus;
  toStatus?: TaskStatus;
}
