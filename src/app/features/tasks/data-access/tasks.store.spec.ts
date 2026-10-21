import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { buildTaskDto, buildUser } from '../../../../testing/builders';
import { errorInterceptor } from '../../../core/http/error.interceptor';
import type { CreateTaskPayload, TaskDto, TasksResponse } from '../../../core/models';
import { NotificationService } from '../../../shared/ui/notifications/notification.service';
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
  let notifications: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  function createStore() {
    notifications = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: notifications },
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

  describe('changes', () => {
    const serverError = { status: 500, statusText: 'Server Error' };

    it('adds a created task and confirms it', async () => {
      const store = await loadedStore();
      const payload: CreateTaskPayload = {
        title: 'Plan sprint',
        description: '',
        status: 'todo',
        priority: 'low',
        dueDate: '2026-10-30',
        assigneeId: 'user-001',
        tags: [],
      };

      const result = store.create(payload);
      httpTesting
        .expectOne('api/tasks')
        .flush(buildTaskDto({ id: 'task-004', title: 'Plan sprint' }));

      expect(await result).toBe(true);
      expect(store.entityMap()['task-004']?.title).toBe('Plan sprint');
      expect(notifications.success).toHaveBeenCalledWith(
        '"Plan sprint" was added to the board.',
        'Task created',
      );
    });

    it('reports a rejected task with the server message', async () => {
      const store = await loadedStore();

      const result = store.create({} as CreateTaskPayload);
      httpTesting
        .expectOne('api/tasks')
        .flush({ message: 'A task needs a title.' }, { status: 422, statusText: 'Unprocessable' });

      expect(await result).toBe(false);
      expect(store.ids()).toHaveLength(3);
      expect(notifications.error).toHaveBeenCalledWith('A task needs a title.');
    });

    it('saves edits from the server response', async () => {
      const store = await loadedStore();

      const result = store.update('task-002', { title: 'Write API docs' });
      httpTesting
        .expectOne('api/tasks/task-002')
        .flush(buildTaskDto({ id: 'task-002', title: 'Write API docs' }));

      expect(await result).toBe(true);
      expect(store.entityMap()['task-002']?.title).toBe('Write API docs');
      expect(notifications.success).toHaveBeenCalled();
    });

    it('keeps the task unchanged when an edit fails', async () => {
      const store = await loadedStore();

      const result = store.update('task-002', { title: 'Write API docs' });
      httpTesting.expectOne('api/tasks/task-002').flush(null, serverError);

      expect(await result).toBe(false);
      expect(store.entityMap()['task-002']?.title).toBe('Write docs');
      expect(notifications.error).toHaveBeenCalled();
    });

    it('moves a card before the server answers and keeps the server result', async () => {
      const store = await loadedStore();

      const result = store.move('task-001', 'done', 0);

      expect(store.columns().todo.map((task) => task.id)).toEqual(['task-002']);
      expect(store.columns().done.map((task) => task.id)).toEqual(['task-001', 'task-003']);
      expect(store.entityMap()['task-001']?.isOverdue).toBe(false);

      const req = httpTesting.expectOne('api/tasks/task-001');
      expect(req.request.body).toEqual({ status: 'done', position: 0 });
      req.flush(
        buildTaskDto({
          id: 'task-001',
          status: 'done',
          position: 0,
          completedAt: '2026-10-21T12:00:00.000Z',
        }),
      );

      expect(await result).toBe(true);
      expect(store.entityMap()['task-001']?.completedAt).toBe('2026-10-21T12:00:00.000Z');
    });

    it('puts a card back when the move fails', async () => {
      const store = await loadedStore();

      const result = store.move('task-001', 'done', 0);
      httpTesting.expectOne('api/tasks/task-001').flush(null, serverError);

      expect(await result).toBe(false);
      expect(store.columns().todo.map((task) => task.id)).toEqual(['task-002', 'task-001']);
      expect(notifications.error).toHaveBeenCalledWith(
        'Something went wrong on our side. Please try again.',
      );
    });

    it('removes a card before the server answers', async () => {
      const store = await loadedStore();

      const result = store.remove('task-002');
      expect(store.ids()).not.toContain('task-002');
      expect(store.entityMap()['task-001']?.position).toBe(0);

      httpTesting
        .expectOne('api/tasks/task-002')
        .flush(null, { status: 204, statusText: 'No Content' });

      expect(await result).toBe(true);
      expect(notifications.success).toHaveBeenCalledWith(
        '"Write docs" was deleted.',
        'Task deleted',
      );
    });

    it('brings a card back when the delete fails', async () => {
      const store = await loadedStore();

      const result = store.remove('task-002');
      httpTesting.expectOne('api/tasks/task-002').flush(null, serverError);

      expect(await result).toBe(false);
      expect(store.ids()).toContain('task-002');
      expect(notifications.error).toHaveBeenCalled();
    });
  });
});
