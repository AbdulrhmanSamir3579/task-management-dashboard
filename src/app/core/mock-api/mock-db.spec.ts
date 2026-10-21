import { buildTaskDto, buildUser } from '../../../testing/builders';
import type { TasksResponse } from '../models';
import {
  assignPositions,
  createMockDb,
  extractUsers,
  moveTask,
  nextTaskId,
  rebaseTasks,
  removeTask,
  seedActivities,
} from './mock-db';
import { seed } from './seed';

describe('rebaseTasks', () => {
  const generatedAt = new Date(2026, 9, 18, 12);
  const now = new Date(2026, 9, 21, 9);

  it('moves every date forward by the days since generation', () => {
    const [task] = rebaseTasks(
      [
        buildTaskDto({
          dueDate: '2026-10-20',
          createdAt: '2026-10-15T10:00:00.000Z',
          updatedAt: '2026-10-17T10:00:00.000Z',
          completedAt: '2026-10-18T08:00:00.000Z',
        }),
      ],
      generatedAt,
      now,
    );

    expect(task).toMatchObject({
      dueDate: '2026-10-23',
      createdAt: '2026-10-18T10:00:00.000Z',
      updatedAt: '2026-10-20T10:00:00.000Z',
      completedAt: '2026-10-21T08:00:00.000Z',
    });
  });

  it('normalises a missing completion date to null', () => {
    const [task] = rebaseTasks([buildTaskDto({ completedAt: undefined })], generatedAt, now);
    expect(task?.completedAt).toBeNull();
  });

  it('keeps dates unchanged on the generation day', () => {
    const original = buildTaskDto();
    const [task] = rebaseTasks([original], generatedAt, generatedAt);
    expect(task).toEqual({ ...original, completedAt: null });
  });
});

describe('assignPositions', () => {
  it('numbers tasks per status column in seed order', () => {
    const tasks = assignPositions([
      buildTaskDto({ id: 'a', status: 'todo' }),
      buildTaskDto({ id: 'b', status: 'done' }),
      buildTaskDto({ id: 'c', status: 'todo' }),
    ]);

    expect(tasks.map((task) => [task.id, task.position])).toEqual([
      ['a', 0],
      ['b', 0],
      ['c', 1],
    ]);
  });
});

describe('extractUsers', () => {
  it('returns each assignee once, sorted by name', () => {
    const sarah = buildUser({ id: 'user-002', name: 'Sarah Smith' });
    const john = buildUser({ id: 'user-001', name: 'John Doe' });

    const users = extractUsers([
      buildTaskDto({ assignee: sarah }),
      buildTaskDto({ assignee: john }),
      buildTaskDto({ assignee: sarah }),
    ]);

    expect(users).toEqual([john, sarah]);
  });
});

describe('seedActivities', () => {
  it('creates history entries from task timestamps, newest first', () => {
    const activities = seedActivities([
      buildTaskDto({
        id: 'done-task',
        status: 'done',
        createdAt: '2026-10-10T10:00:00.000Z',
        updatedAt: '2026-10-12T10:00:00.000Z',
        completedAt: '2026-10-12T10:00:00.000Z',
      }),
      buildTaskDto({
        id: 'edited-task',
        createdAt: '2026-10-11T10:00:00.000Z',
        updatedAt: '2026-10-13T10:00:00.000Z',
      }),
      buildTaskDto({
        id: 'new-task',
        createdAt: '2026-10-14T10:00:00.000Z',
        updatedAt: '2026-10-14T10:00:00.000Z',
      }),
    ]);

    expect(activities.map((a) => [a.id, a.taskId, a.type])).toEqual([
      ['activity-1', 'new-task', 'created'],
      ['activity-2', 'edited-task', 'updated'],
      ['activity-3', 'done-task', 'status_changed'],
      ['activity-4', 'edited-task', 'created'],
      ['activity-5', 'done-task', 'created'],
    ]);
    expect(activities[2]).toMatchObject({ toStatus: 'done', actor: 'John Doe' });
  });
});

describe('createMockDb', () => {
  it('builds tasks, users and activities from a seed', () => {
    const response: TasksResponse = {
      tasks: [buildTaskDto()],
      meta: { totalCount: 1, lastUpdated: '2026-10-21T10:00:00.000Z' },
    };

    const db = createMockDb(response, new Date('2026-10-21T12:00:00.000Z'));

    expect(db.tasks).toHaveLength(1);
    expect(db.users).toEqual([response.tasks[0]?.assignee]);
    expect(db.activities.length).toBeGreaterThan(0);
  });

  it('accepts the generated seed file', () => {
    const db = createMockDb(seed, new Date(seed.meta.lastUpdated));

    expect(db.tasks).toHaveLength(seed.meta.totalCount);
    expect(db.users).toHaveLength(4);
  });
});

describe('nextTaskId', () => {
  it('continues after the highest numeric id', () => {
    expect(nextTaskId([buildTaskDto({ id: 'task-009' }), buildTaskDto({ id: 'task-017' })])).toBe(
      'task-018',
    );
  });

  it('starts at 001 and ignores ids without digits', () => {
    expect(nextTaskId([])).toBe('task-001');
    expect(nextTaskId([buildTaskDto({ id: 'custom' })])).toBe('task-001');
  });
});

describe('moveTask', () => {
  const board = [
    buildTaskDto({ id: 'a', status: 'todo', position: 0 }),
    buildTaskDto({ id: 'b', status: 'todo', position: 1 }),
    buildTaskDto({ id: 'c', status: 'todo', position: 2 }),
    buildTaskDto({ id: 'd', status: 'done', position: 0 }),
  ];
  const columns = (tasks: ReturnType<typeof moveTask>) =>
    Object.fromEntries(
      ['todo', 'in_progress', 'done'].map((status) => [
        status,
        tasks
          .filter((task) => task.status === status)
          .sort((x, y) => (x.position ?? 0) - (y.position ?? 0))
          .map((task) => task.id),
      ]),
    );

  it('reorders inside a column', () => {
    expect(columns(moveTask(board, 'c', 'todo', 0))).toEqual({
      todo: ['c', 'a', 'b'],
      in_progress: [],
      done: ['d'],
    });
  });

  it('moves across columns and closes the gap left behind', () => {
    const tasks = moveTask(board, 'a', 'done', 0);

    expect(columns(tasks)).toEqual({ todo: ['b', 'c'], in_progress: [], done: ['a', 'd'] });
    expect(tasks.find((task) => task.id === 'b')?.position).toBe(0);
  });

  it('appends to the end of the column when no position is given', () => {
    expect(columns(moveTask(board, 'a', 'done'))).toMatchObject({ done: ['d', 'a'] });
  });

  it('clamps out of range positions', () => {
    expect(columns(moveTask(board, 'a', 'todo', 99))).toMatchObject({ todo: ['b', 'c', 'a'] });
  });

  it('returns the tasks unchanged for an unknown id', () => {
    expect(moveTask(board, 'missing', 'done')).toEqual(board);
  });
});

describe('removeTask', () => {
  it('removes the task and renumbers its column', () => {
    const tasks = removeTask(
      [
        buildTaskDto({ id: 'a', status: 'todo', position: 0 }),
        buildTaskDto({ id: 'b', status: 'todo', position: 1 }),
        buildTaskDto({ id: 'c', status: 'todo', position: 2 }),
      ],
      'a',
    );

    expect(tasks.map((task) => [task.id, task.position])).toEqual([
      ['b', 0],
      ['c', 1],
    ]);
  });

  it('returns the remaining tasks for an unknown id', () => {
    const tasks = [buildTaskDto({ id: 'a' })];
    expect(removeTask(tasks, 'missing')).toEqual(tasks);
  });
});
