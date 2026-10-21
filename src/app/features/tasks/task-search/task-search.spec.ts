import type { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { type TaskSearchState, type TaskSuggestion, taskSearch } from './task-search';

const resultsFor = (query: string): TaskSuggestion[] => [
  { id: 'task-001', title: `Result for ${query}`, description: '' },
];
const loading = (query: string): TaskSearchState => ({ query, status: 'loading', results: [] });
const success = (query: string): TaskSearchState => ({
  query,
  status: 'success',
  results: resultsFor(query),
});

describe('taskSearch', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  });

  it('waits for a pause in typing, then shows loading and results', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const input = hot('a 99ms b 99ms c', { a: 'bu', b: 'bud', c: 'budget' });
      const search = (query: string) => cold('--r|', { r: resultsFor(query) });

      // Only "budget" is searched: 300ms after the last keystroke at frame 200.
      expectObservable(input.pipe(taskSearch(search))).toBe('500ms l-r', {
        l: loading('budget'),
        r: success('budget'),
      });
    });
  });

  it('trims the query and skips a repeated one', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const input = hot('a 400ms b', { a: 'budget', b: '  budget  ' });
      const search = (query: string) => cold('r|', { r: resultsFor(query) });

      expectObservable(input.pipe(taskSearch(search))).toBe('300ms (lr)', {
        l: loading('budget'),
        r: success('budget'),
      });
    });
  });

  it('does not search queries shorter than the minimum length', () => {
    scheduler.run(({ hot, expectObservable }) => {
      const search = vi.fn<(query: string) => Observable<TaskSuggestion[]>>();
      const input = hot('a', { a: ' b ' });

      expectObservable(input.pipe(taskSearch(search))).toBe('300ms i', {
        i: { query: 'b', status: 'idle', results: [] },
      });
      scheduler.flush();
      expect(search).not.toHaveBeenCalled();
    });
  });

  it('cancels a slow request when a newer query arrives', () => {
    scheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const slow = cold('500ms r|', { r: resultsFor('bud') });
      const fast = cold('--r|', { r: resultsFor('budget') });
      const input = hot('a 349ms b', { a: 'bud', b: 'budget' });

      expectObservable(input.pipe(taskSearch((query) => (query === 'bud' ? slow : fast)))).toBe(
        '300ms l 349ms m-r',
        { l: loading('bud'), m: loading('budget'), r: success('budget') },
      );
      // The "bud" request starts at 300ms and is cancelled at 650ms, before it answers.
      expectSubscriptions(slow.subscriptions).toBe('300ms ^ 349ms !');
    });
  });

  it('reports a failed search and keeps searching afterwards', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const input = hot('a 400ms b', { a: 'broken', b: 'budget' });
      const search = (query: string) =>
        query === 'broken' ? cold<TaskSuggestion[]>('-#') : cold('-r|', { r: resultsFor(query) });

      expectObservable(input.pipe(taskSearch(search))).toBe('300ms le 399ms mr', {
        l: loading('broken'),
        e: { query: 'broken', status: 'error', results: [] },
        m: loading('budget'),
        r: success('budget'),
      });
    });
  });

  it('searches at once when the delay is 0, for example over loaded tasks', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const input = hot('a', { a: 'budget' });
      const search = (query: string) => cold('(r|)', { r: resultsFor(query) });

      expectObservable(input.pipe(taskSearch(search, { debounceMs: () => 0 }))).toBe('(lr)', {
        l: loading('budget'),
        r: success('budget'),
      });
    });
  });

  it('reads the delay for every query', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      let loaded = false;
      const input = hot('a 400ms b', { a: 'bud', b: 'budget' });
      const search = (query: string) => {
        loaded = true;
        return cold('(r|)', { r: resultsFor(query) });
      };

      // "bud" waits 300ms (not loaded yet); "budget" runs at once at 401ms.
      expectObservable(
        input.pipe(taskSearch(search, { debounceMs: () => (loaded ? 0 : 300) })),
      ).toBe('300ms (lr) 97ms (mn)', {
        l: loading('bud'),
        r: success('bud'),
        m: loading('budget'),
        n: success('budget'),
      });
    });
  });
});
