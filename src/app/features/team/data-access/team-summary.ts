import type { Task, User } from '../../../core/models';

/** One person and how their tasks stand. */
export interface TeamMember {
  user: User;
  /** Not done yet: to do and in progress. */
  open: number;
  inProgress: number;
  done: number;
  overdue: number;
  total: number;
  /** Share of their tasks that are done, 0–100. */
  completion: number;
}

/** Every user in the given order, with their task counts; people without tasks included. */
export function summarizeTeam(users: readonly User[], tasks: readonly Task[]): TeamMember[] {
  return users.map((user) => {
    const own = tasks.filter((task) => task.assignee.id === user.id);
    const done = own.filter((task) => task.status === 'done').length;
    return {
      user,
      open: own.length - done,
      inProgress: own.filter((task) => task.status === 'in_progress').length,
      done,
      overdue: own.filter((task) => task.isOverdue).length,
      total: own.length,
      completion: own.length ? Math.round((done / own.length) * 100) : 0,
    };
  });
}
