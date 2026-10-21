import { buildTaskDto } from '../../../testing/builders';
import { rankByText } from './text-search';

describe('rankByText', () => {
  const tasks = [
    buildTaskDto({ id: 'a', title: 'Write release notes', description: 'Summarise the sprint' }),
    buildTaskDto({ id: 'b', title: 'Sprint planning', description: 'Plan the next two weeks' }),
    buildTaskDto({ id: 'c', title: 'Fix login', description: undefined }),
  ];

  it('matches titles before descriptions, ignoring case', () => {
    expect(rankByText(tasks, '  SPRINT ').map((task) => task.id)).toEqual(['b', 'a']);
  });

  it('returns every task for an empty query', () => {
    expect(rankByText(tasks, '   ')).toHaveLength(3);
  });

  it('returns nothing when no task matches', () => {
    expect(rankByText(tasks, 'budget')).toEqual([]);
  });
});
