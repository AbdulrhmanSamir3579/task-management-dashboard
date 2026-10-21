import { buildTaskDto } from '../../../testing/builders';
import { moveOnBoard, removeFromBoard } from './board-order';

describe('moveOnBoard', () => {
  const board = [
    buildTaskDto({ id: 'a', status: 'todo', position: 0 }),
    buildTaskDto({ id: 'b', status: 'todo', position: 1 }),
    buildTaskDto({ id: 'c', status: 'todo', position: 2 }),
    buildTaskDto({ id: 'd', status: 'done', position: 0 }),
  ];
  const columns = (tasks: ReturnType<typeof moveOnBoard>) =>
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
    expect(columns(moveOnBoard(board, 'c', 'todo', 0))).toEqual({
      todo: ['c', 'a', 'b'],
      in_progress: [],
      done: ['d'],
    });
  });

  it('moves across columns and closes the gap left behind', () => {
    const tasks = moveOnBoard(board, 'a', 'done', 0);

    expect(columns(tasks)).toEqual({ todo: ['b', 'c'], in_progress: [], done: ['a', 'd'] });
    expect(tasks.find((task) => task.id === 'b')?.position).toBe(0);
  });

  it('appends to the end of the column when no position is given', () => {
    expect(columns(moveOnBoard(board, 'a', 'done'))).toMatchObject({ done: ['d', 'a'] });
  });

  it('clamps out of range positions', () => {
    expect(columns(moveOnBoard(board, 'a', 'todo', 99))).toMatchObject({ todo: ['b', 'c', 'a'] });
  });

  it('returns the tasks unchanged for an unknown id', () => {
    expect(moveOnBoard(board, 'missing', 'done')).toEqual(board);
  });
});

describe('removeFromBoard', () => {
  it('removes the task and renumbers its column', () => {
    const tasks = removeFromBoard(
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
    expect(removeFromBoard(tasks, 'missing')).toEqual(tasks);
  });
});
