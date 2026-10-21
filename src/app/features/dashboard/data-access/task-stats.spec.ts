import { buildTask } from '../../../../testing/builders';
import { computeTaskStats } from './task-stats';

const today = '2026-10-21';
const at = (day: string) => `${day}T09:00:00`;

describe('computeTaskStats', () => {
  const tasks = [
    buildTask({ id: 'new', status: 'todo', dueDate: '2026-10-25', createdAt: at('2026-10-20') }),
    buildTask({ id: 'old', status: 'todo', dueDate: '2026-10-20', createdAt: at('2026-10-01') }),
    buildTask({
      id: 'late',
      status: 'in_progress',
      dueDate: '2026-10-15',
      createdAt: at('2026-10-01'),
    }),
    buildTask({
      id: 'soon',
      status: 'in_progress',
      dueDate: '2026-10-24',
      createdAt: at('2026-10-15'),
    }),
    buildTask({
      id: 'later',
      status: 'in_progress',
      dueDate: '2026-11-30',
      createdAt: at('2026-10-02'),
    }),
    buildTask({
      id: 'done-today',
      status: 'done',
      dueDate: '2026-10-19',
      createdAt: at('2026-10-02'),
      completedAt: at('2026-10-21'),
    }),
    buildTask({
      id: 'done-before',
      status: 'done',
      dueDate: '2026-10-10',
      createdAt: at('2026-10-02'),
      completedAt: at('2026-10-09'),
    }),
  ];

  const byId = () =>
    Object.fromEntries(computeTaskStats(tasks, today).map((stat) => [stat.id, stat]));

  it('returns the four dashboard cards in design order', () => {
    expect(computeTaskStats(tasks, today).map((stat) => [stat.title, stat.icon])).toEqual([
      ['Total Tasks', '📊'],
      ['Completed', '✅'],
      ['In Progress', '🔄'],
      ['Overdue', '⚠️'],
    ]);
  });

  it('counts all tasks and the ones created this week', () => {
    expect(byId()['total']).toMatchObject({
      value: 7,
      change: '+2',
      changeLabel: 'this week',
      changeType: 'positive',
    });
  });

  it('counts done tasks and the ones completed today', () => {
    expect(byId()['completed']).toMatchObject({
      value: 2,
      change: '+1',
      changeLabel: 'today',
      changeType: 'positive',
    });
  });

  it('counts tasks in progress and how many are due this week', () => {
    expect(byId()['in-progress']).toMatchObject({
      value: 3,
      change: '1',
      changeLabel: 'due this week',
      changeType: 'neutral',
    });
  });

  it('counts open tasks past their due date and the ones that became overdue today', () => {
    expect(byId()['overdue']).toMatchObject({
      value: 2,
      change: '+1',
      changeLabel: 'today',
      changeType: 'negative',
    });
  });

  it('shows neutral changes when nothing happened', () => {
    const stats = computeTaskStats([], today);

    expect(stats.map((stat) => [stat.value, stat.change, stat.changeType])).toEqual([
      [0, '0', 'neutral'],
      [0, '0', 'neutral'],
      [0, '0', 'neutral'],
      [0, '0', 'neutral'],
    ]);
  });
});
