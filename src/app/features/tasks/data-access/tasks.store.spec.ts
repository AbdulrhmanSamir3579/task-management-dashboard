import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { buildTaskDto, buildUser } from '../../../../testing/builders';
import { errorInterceptor } from '../../../core/http/error.interceptor';
import type { TaskDto, TasksResponse } from '../../../core/models';
import { SEARCH_DEBOUNCE_MS, TasksStore } from './tasks.store';

const seed: TaskDto[] = [
  buildTaskDto({
    id: 'task-001',
    title: 'Prepare budget',
    status: 'todo',
    position: 1,
    dueDate: '2000-01-01',
  }),
  buildTaskDto({ id: 'task-002', title: 'Write docs', status: 'todo', position: 0 }),
  buildTaskDto({
    id: 'task-003',
    title: 'Security audit',
    status: 'done',
    assignee: buildUser({ id: 'user-002', name: 'Sarah Smith' }),
  }),
];

const response = (tasks: TaskDto[] = seed): TasksResponse => ({
  tasks,
  meta: { totalCount: tasks.length, lastUpdated: '2026-10-21T10:00:00.000Z' },
});

describe('TasksStore', () => {
  let httpTesting: HttpTestingController;

  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  function createStore() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    const store = TestBed.inject(TasksStore);
    TestBed.tick();
    return store;
  }

  async function loadedStore() {
    const store = createStore();
    httpTesting.expectOne('api/tasks').flush(response());
    await settle();
    return store;
  }

  afterEach(() => httpTesting.verify());

  describe('loading', () => {
    it('is loading until the first response arrives', async () => {
      const store = createStore();
      expect(store.isLoading()).toBe(true);
      expect(store.hasLoaded()).toBe(false);

      httpTesting.expectOne('api/tasks').flush(response());
      await settle();

      expect(store.isLoading()).toBe(false);
      expect(store.hasLoaded()).toBe(true);
    });

    it('keeps loaded tasks as entities with derived fields', async () => {
      const store = await loadedStore();

      expect(store.ids()).toEqual(['task-001', 'task-002', 'task-003']);
      expect(store.entityMap()['task-001']?.isOverdue).toBe(true);
      expect(store.entityMap()['task-003']?.isOverdue).toBe(false);
    });

    it('exposes a readable error and recovers on reload', async () => {
      const store = createStore();
      httpTesting
        .expectOne('api/tasks')
        .flush({ message: 'Down' }, { status: 503, statusText: 'Service Unavailable' });
      await settle();

      expect(store.loadError()).toBe('Something went wrong on our side. Please try again.');

      store.reload();
      TestBed.tick();
      httpTesting.expectOne('api/tasks').flush(response());
      await settle();

      expect(store.loadError()).toBeNull();
      expect(store.ids()).toHaveLength(3);
    });
  });

  describe('filters', () => {
    it('groups visible tasks into ordered board columns', async () => {
      const store = await loadedStore();

      expect(store.columns().todo.map((task) => task.id)).toEqual(['task-002', 'task-001']);
      expect(store.columns().done.map((task) => task.id)).toEqual(['task-003']);
    });

    it('applies and resets filters', async () => {
      const store = await loadedStore();

      store.setFilters({ assigneeId: 'user-002' });
      expect(store.filteredTasks().map((task) => task.id)).toEqual(['task-003']);
      expect(store.hasActiveFilters()).toBe(true);

      store.setFilters({ statuses: ['todo'] });
      expect(store.filteredTasks()).toEqual([]);

      store.resetFilters();
      expect(store.filteredTasks()).toHaveLength(3);
      expect(store.hasActiveFilters()).toBe(false);
    });

    it('debounces search', async () => {
      const store = await loadedStore();
      vi.useFakeTimers();

      store.search('budget');
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
      expect(store.filters().search).toBe('');

      vi.advanceTimersByTime(1);
      expect(store.filters().search).toBe('budget');
      expect(store.filteredTasks().map((task) => task.id)).toEqual(['task-001']);

      vi.useRealTimers();
    });
  });
});
