import type { User } from './user.model';

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';

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
}

/** Body of `PATCH /api/tasks/:id`. Every field is optional. */
export type UpdateTaskPayload = Partial<CreateTaskPayload> & { position?: number };
