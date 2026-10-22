import { buildTask, buildUser } from '../../../../testing/builders';
import {
  EMPTY_TASK_FILTERS,
  type TaskFilters,
  countPanelFilters,
  filterTasks,
  groupByStatus,
  hasActiveFilters,
} from './task-filters';

const sarah = buildUser({ id: 'user-002', name: 'Sarah Smith' });
const tasks = [
  buildTask({ id: 'a', title: 'Prepare Q4 budget report', status: 'todo', priority: 'high' }),
  buildTask({
    id: 'b',
    title: 'Update docs',
    description: 'Review the API documentation',
    status: 'in_progress',
    priority: 'medium',
    assignee: sarah,
  }),
  buildTask({ id: 'c', title: 'Security audit', status: 'done', priority: 'low', assignee: sarah }),
];

const ids = (filters: Partial<TaskFilters>) =>
  filterTasks(tasks, { ...EMPTY_TASK_FILTERS, ...filters }).map((task) => task.id);

describe('filterTasks', () => {
  it('returns everything without filters', () => {
    expect(ids({})).toEqual(['a', 'b', 'c']);
  });

  it('searches titles and descriptions, ignoring case and surrounding spaces', () => {
    expect(ids({ search: '  BUDGET ' })).toEqual(['a']);
    expect(ids({ search: 'api documentation' })).toEqual(['b']);
  });

  it('keeps tasks matching any selected status or priority', () => {
    expect(ids({ statuses: ['todo', 'done'] })).toEqual(['a', 'c']);
    expect(ids({ priorities: ['medium'] })).toEqual(['b']);
  });

  it('filters by assignee', () => {
    expect(ids({ assigneeId: 'user-002' })).toEqual(['b', 'c']);
  });

  it('combines filters', () => {
    expect(ids({ assigneeId: 'user-002', statuses: ['done'], search: 'audit' })).toEqual(['c']);
  });
});

describe('hasActiveFilters', () => {
  it('is false for the empty filters and blank search', () => {
    expect(hasActiveFilters(EMPTY_TASK_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_TASK_FILTERS, search: '   ' })).toBe(false);
  });

  it.each<Partial<TaskFilters>>([
    { search: 'x' },
    { statuses: ['done'] },
    { priorities: ['high'] },
    { assigneeId: 'user-001' },
  ])('is true when %j is set', (filters) => {
    expect(hasActiveFilters({ ...EMPTY_TASK_FILTERS, ...filters })).toBe(true);
  });
});

describe('countPanelFilters', () => {
  it('counts chosen priorities and the assignee, not search or status', () => {
    expect(countPanelFilters({ ...EMPTY_TASK_FILTERS, search: 'x', statuses: ['done'] })).toBe(0);
    expect(
      countPanelFilters({ ...EMPTY_TASK_FILTERS, priorities: ['high', 'low'], assigneeId: 'u' }),
    ).toBe(3);
  });
});

describe('groupByStatus', () => {
  it('splits tasks into columns ordered by position', () => {
    const columns = groupByStatus([
      buildTask({ id: 'late', status: 'todo', position: 2 }),
      buildTask({ id: 'early', status: 'todo', position: 0 }),
      buildTask({ id: 'done', status: 'done', position: 0 }),
    ]);

    expect(columns.todo.map((task) => task.id)).toEqual(['early', 'late']);
    expect(columns.in_progress).toEqual([]);
    expect(columns.done.map((task) => task.id)).toEqual(['done']);
  });
});
