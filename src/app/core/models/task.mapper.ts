import type { Task, TaskDto } from './task.model';

/**
 * A task is overdue when its due date is before today and it is not done.
 * Dates are `YYYY-MM-DD` strings, so a plain string comparison is a date comparison.
 */
export function isTaskOverdue(task: Pick<TaskDto, 'status' | 'dueDate'>, today: string): boolean {
  return task.status !== 'done' && task.dueDate < today;
}

/** Converts an API task into the UI model, filling optional fields with safe defaults. */
export function toTask(dto: TaskDto, today: string): Task {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description ?? '',
    status: dto.status,
    priority: dto.priority,
    dueDate: dto.dueDate,
    isOverdue: isTaskOverdue(dto, today),
    completedAt: dto.completedAt ?? null,
    assignee: dto.assignee,
    tags: dto.tags ?? [],
    checklist: dto.checklist ?? [],
    position: dto.position ?? 0,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}
