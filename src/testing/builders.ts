import type { Task, TaskDto, User } from '../app/core/models';

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-001',
    name: 'John Doe',
    avatar: 'JD',
    email: 'john.doe@company.com',
    ...overrides,
  };
}

export function buildTaskDto(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: 'task-001',
    title: 'Design new homepage layout',
    description: 'Create wireframes and mockups',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-10-23',
    assignee: buildUser(),
    tags: ['Design'],
    position: 0,
    createdAt: '2026-10-19T10:00:00.000Z',
    updatedAt: '2026-10-21T10:00:00.000Z',
    ...overrides,
  };
}

export function buildTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-001',
    title: 'Design new homepage layout',
    description: 'Create wireframes and mockups',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-10-23',
    isOverdue: false,
    completedAt: null,
    assignee: buildUser(),
    tags: ['Design'],
    checklist: [],
    position: 0,
    createdAt: '2026-10-19T10:00:00.000Z',
    updatedAt: '2026-10-21T10:00:00.000Z',
    ...overrides,
  };
}
