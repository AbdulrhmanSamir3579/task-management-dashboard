import { EMPTY_TASK_FILTERS } from './task-filters';
import { filtersFromParams, filtersToParams, sameParams } from './task-filter-params';

describe('task filter params', () => {
  it('writes active filters and leaves the others out', () => {
    expect(filtersToParams(EMPTY_TASK_FILTERS)).toEqual({
      q: null,
      status: null,
      priority: null,
      assignee: null,
    });
    expect(
      filtersToParams({
        search: ' budget ',
        statuses: ['todo', 'done'],
        priorities: ['high'],
        assigneeId: 'user-002',
      }),
    ).toEqual({ q: 'budget', status: 'todo,done', priority: 'high', assignee: 'user-002' });
  });

  it('reads filters back from the params', () => {
    expect(
      filtersFromParams({
        q: 'budget',
        status: 'done,todo',
        priority: 'low',
        assignee: 'user-002',
      }),
    ).toEqual({
      search: 'budget',
      statuses: ['todo', 'done'],
      priorities: ['low'],
      assigneeId: 'user-002',
    });
  });

  it('treats missing, empty and unknown values as no filter', () => {
    expect(filtersFromParams({})).toEqual(EMPTY_TASK_FILTERS);
    expect(
      filtersFromParams({ q: '  ', status: 'archived', priority: 'urgent,,', assignee: ' ' }),
    ).toEqual(EMPTY_TASK_FILTERS);
    expect(filtersFromParams({ status: 'done,done,nope' }).statuses).toEqual(['done']);
  });

  it('compares params with missing and null as the same', () => {
    expect(sameParams({ q: 'a' }, { q: 'a', status: null })).toBe(true);
    expect(sameParams({ q: 'a' }, { q: 'b' })).toBe(false);
    expect(sameParams({}, { assignee: 'user-001' })).toBe(false);
  });
});
