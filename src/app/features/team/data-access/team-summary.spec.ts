import { buildTask, buildUser } from '../../../../testing/builders';
import { summarizeTeam } from './team-summary';

const john = buildUser({ id: 'user-001', name: 'John Doe' });
const sarah = buildUser({ id: 'user-002', name: 'Sarah Smith', avatar: 'SS' });

describe('summarizeTeam', () => {
  it('counts each person’s open, in progress, done and overdue tasks', () => {
    const [first, second] = summarizeTeam(
      [john, sarah],
      [
        buildTask({ id: 'a', status: 'todo', isOverdue: true, assignee: john }),
        buildTask({ id: 'b', status: 'in_progress', assignee: john }),
        buildTask({ id: 'c', status: 'done', assignee: john }),
        buildTask({ id: 'd', status: 'done', assignee: john }),
        buildTask({ id: 'e', status: 'todo', assignee: sarah }),
      ],
    );

    expect(first).toEqual({
      user: john,
      open: 2,
      inProgress: 1,
      done: 2,
      overdue: 1,
      total: 4,
      completion: 50,
    });
    expect(second).toMatchObject({ user: sarah, open: 1, done: 0, total: 1, completion: 0 });
  });

  it('keeps people without tasks', () => {
    expect(summarizeTeam([sarah], [])).toEqual([
      { user: sarah, open: 0, inProgress: 0, done: 0, overdue: 0, total: 0, completion: 0 },
    ]);
  });
});
