import type { TranslationKey } from '../i18n/translation-key';
import type { User } from './user.model';

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';

/** Board order of the statuses. */
export const TASK_STATUSES: readonly TaskStatus[] = ['todo', 'in_progress', 'done'];

/** Translation keys of the status names. */
export const TASK_STATUS_KEYS: Readonly<Record<TaskStatus, TranslationKey>> = {
  todo: 'TASK.STATUS.TODO',
  in_progress: 'TASK.STATUS.IN_PROGRESS',
  done: 'TASK.STATUS.DONE',
};

/** Priorities from most to least urgent. */
export const TASK_PRIORITIES: readonly TaskPriority[] = ['high', 'medium', 'low'];

/** Translation keys of the priority names. */
export const TASK_PRIORITY_KEYS: Readonly<Record<TaskPriority, TranslationKey>> = {
  high: 'TASK.PRIORITY.HIGH',
  medium: 'TASK.PRIORITY.MEDIUM',
  low: 'TASK.PRIORITY.LOW',
};

/** One step of a task's checklist. */
export interface ChecklistItem {
  text: string;
  done: boolean;
}

/** Task as sent over the wire by the API (see DATA_README.md). */
export interface TaskDto {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** Calendar date in `YYYY-MM-DD` format. */
  dueDate: string;
  /** Stored by the API but recomputed on the client, because it goes stale. */
  isOverdue?: boolean;
  completedAt?: string | null;
  assignee: User;
  tags?: string[];
  /** Not part of the generated seed data; missing means an empty checklist. */
  checklist?: ChecklistItem[];
  /** Order of the task inside its status column. */
  position?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TasksResponse {
  tasks: TaskDto[];
  meta: {
    totalCount: number;
    lastUpdated: string;
  };
}

/** Task as used by the UI: optional fields normalised and `isOverdue` derived. */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;
  completedAt: string | null;
  assignee: User;
  tags: string[];
  checklist: ChecklistItem[];
  position: number;
  createdAt: string;
  updatedAt: string;
}

/** Body of `POST /api/tasks`. */
export interface CreateTaskPayload {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string;
  tags: string[];
  checklist?: ChecklistItem[];
  /** Only used for done tasks; the server uses the current time when it is missing. */
  completedAt?: string | null;
}

/** Body of `PATCH /api/tasks/:id`. Every field is optional. */
export type UpdateTaskPayload = Partial<CreateTaskPayload> & { position?: number };
