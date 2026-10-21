import { HttpClient, HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import type {
  Activity,
  CreateTaskPayload,
  TaskDto,
  TasksResponse,
  UpdateTaskPayload,
  User,
} from '../models';
import { CURRENT_USER_NAME } from './in-memory-data.service';
import { provideMockApi } from './provide-mock-api';

describe('InMemoryDataService', () => {
  const now = new Date('2026-10-21T12:00:00.000Z');
  let http: HttpClient;

  const getTasks = () => firstValueFrom(http.get<TasksResponse>('api/tasks'));
  const getTask = async (id: string) => (await getTasks()).tasks.find((task) => task.id === id);
  const getActivities = () => firstValueFrom(http.get<Activity[]>('api/activities'));
  const patchTask = (id: string, changes: UpdateTaskPayload) =>
    firstValueFrom(http.patch<TaskDto>(`api/tasks/${id}`, changes));
  const column = async (status: TaskDto['status']) =>
    (await getTasks()).tasks
      .filter((task) => task.status === status)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((task) => task.id);

  const newTask: CreateTaskPayload = {
    title: '  Write release notes  ',
    description: 'Summarise the sprint',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-10-30',
    assigneeId: 'user-002',
    tags: ['Docs'],
  };

  beforeEach(() => {
    // Fake only the date, so the API's own timers keep working.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(now);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideMockApi({ delay: 0 })],
    });
    http = TestBed.inject(HttpClient);
  });

  afterEach(() => vi.useRealTimers());

  describe('reads', () => {
    it('wraps tasks in the TasksResponse envelope', async () => {
      const response = await getTasks();

      expect(response.tasks.length).toBeGreaterThan(0);
      expect(response.meta).toEqual({
        totalCount: response.tasks.length,
        lastUpdated: now.toISOString(),
      });
    });

    it('searches titles and descriptions and limits the results', async () => {
      const all = await firstValueFrom(
        http.get<TasksResponse>('api/tasks', { params: { search: 'api' } }),
      );
      const limited = await firstValueFrom(
        http.get<TasksResponse>('api/tasks', { params: { search: 'api', limit: 1 } }),
      );

      expect(all.tasks.length).toBeGreaterThan(1);
      expect(
        all.tasks.every((task) =>
          `${task.title} ${task.description}`.toLowerCase().includes('api'),
        ),
      ).toBe(true);
      expect(limited.tasks).toHaveLength(1);
      expect(limited.meta.totalCount).toBe(all.tasks.length);
    });

    it('serves the users derived from assignees', async () => {
      const users = await firstValueFrom(http.get<User[]>('api/users'));
      expect(users.map((user) => user.id)).toContain('user-001');
    });

    it('serves activities newest first', async () => {
      const timestamps = (await getActivities()).map((activity) => activity.timestamp);
      expect(timestamps).toEqual([...timestamps].sort().reverse());
    });

    it('returns copies, so callers cannot change the database', async () => {
      const first = await getTasks();
      first.tasks[0]!.title = 'Changed locally';

      expect((await getTasks()).tasks[0]?.title).not.toBe('Changed locally');
    });
  });

  describe('POST /api/tasks', () => {
    it('creates a task with server-side id, timestamps, assignee and position', async () => {
      const todoCount = (await column('todo')).length;

      const created = await firstValueFrom(http.post<TaskDto>('api/tasks', newTask));

      expect(created).toMatchObject({
        title: 'Write release notes',
        assignee: { id: 'user-002' },
        position: todoCount,
        completedAt: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
      expect(created.id).toMatch(/^task-\d{3}$/);
      expect(await getTask(created.id)).toEqual(created);
    });

    it('records the creation in the activity feed', async () => {
      const created = await firstValueFrom(http.post<TaskDto>('api/tasks', newTask));
      const [latest] = await getActivities();

      expect(latest).toMatchObject({
        type: 'created',
        taskId: created.id,
        actor: CURRENT_USER_NAME,
        timestamp: now.toISOString(),
      });
    });

    it('sets the completion date for tasks created as done', async () => {
      const created = await firstValueFrom(
        http.post<TaskDto>('api/tasks', { ...newTask, status: 'done' }),
      );
      expect(created.completedAt).toBe(now.toISOString());
    });

    it('keeps a completion date sent with a task created as done', async () => {
      const created = await firstValueFrom(
        http.post<TaskDto>('api/tasks', {
          ...newTask,
          status: 'done',
          completedAt: '2026-10-19T12:00:00.000Z',
        }),
      );
      expect(created.completedAt).toBe('2026-10-19T12:00:00.000Z');
    });

    it('ignores a completion date for tasks that are not done', async () => {
      const created = await firstValueFrom(
        http.post<TaskDto>('api/tasks', { ...newTask, completedAt: '2026-10-19T12:00:00.000Z' }),
      );
      expect(created.completedAt).toBeNull();
    });

    it('rejects a blank title or unknown assignee with 422', async () => {
      const blank = firstValueFrom(http.post('api/tasks', { ...newTask, title: '   ' }));
      const unknown = firstValueFrom(http.post('api/tasks', { ...newTask, assigneeId: 'nobody' }));

      await expect(blank).rejects.toBeInstanceOf(HttpErrorResponse);
      await expect(blank).rejects.toMatchObject({ status: 422 });
      await expect(unknown).rejects.toMatchObject({
        status: 422,
        error: { message: expect.any(String) },
      });
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('moves a task to done, stamps completion and logs the status change', async () => {
      const updated = await patchTask('task-001', { status: 'done' });

      expect(updated).toMatchObject({ status: 'done', completedAt: now.toISOString() });
      expect((await column('done')).at(-1)).toBe('task-001');
      expect((await getActivities())[0]).toMatchObject({
        type: 'status_changed',
        fromStatus: 'todo',
        toStatus: 'done',
      });
    });

    it('uses the completion date sent when a task is moved to done', async () => {
      const updated = await patchTask('task-001', {
        status: 'done',
        completedAt: '2026-10-20T12:00:00.000Z',
      });
      expect(updated.completedAt).toBe('2026-10-20T12:00:00.000Z');
    });

    it('changes the completion date of a done task and logs it as an update', async () => {
      const updated = await patchTask('task-009', { completedAt: '2026-10-18T12:00:00.000Z' });

      expect(updated.completedAt).toBe('2026-10-18T12:00:00.000Z');
      expect((await getActivities())[0]).toMatchObject({ type: 'updated', taskId: 'task-009' });
    });

    it('clears the completion date when a task is reopened', async () => {
      const reopened = await patchTask('task-009', { status: 'in_progress' });
      expect(reopened.completedAt).toBeNull();
    });

    it('logs field edits as updates and keeps the column order', async () => {
      const before = await column('todo');

      const updated = await patchTask('task-002', {
        title: 'Update API docs',
        assigneeId: 'user-001',
      });

      expect(updated).toMatchObject({ title: 'Update API docs', assignee: { id: 'user-001' } });
      expect(await column('todo')).toEqual(before);
      expect((await getActivities())[0]).toMatchObject({ type: 'updated', taskId: 'task-002' });
    });

    it('reorders inside a column without adding activity noise', async () => {
      const before = await column('todo');
      const activityCount = (await getActivities()).length;
      const last = before.at(-1)!;

      await patchTask(last, { position: 0 });

      expect(await column('todo')).toEqual([last, ...before.slice(0, -1)]);
      expect(await getActivities()).toHaveLength(activityCount);
    });

    it('returns 404 for an unknown task and 422 for an unknown assignee', async () => {
      await expect(patchTask('task-999', { title: 'x' })).rejects.toMatchObject({ status: 404 });
      await expect(patchTask('task-001', { assigneeId: 'nobody' })).rejects.toMatchObject({
        status: 422,
      });
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('removes the task, closes the column gap and logs the deletion', async () => {
      const [first, ...rest] = await column('todo');

      await firstValueFrom(http.delete(`api/tasks/${first}`));

      expect(await column('todo')).toEqual(rest);
      expect(await getTask(first!)).toBeUndefined();
      expect((await getActivities())[0]).toMatchObject({ type: 'deleted', taskId: first });
    });

    it('returns 404 for an unknown task', async () => {
      await expect(firstValueFrom(http.delete('api/tasks/task-999'))).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  it('keeps users and activities read-only', async () => {
    const attempts = [
      firstValueFrom(http.post('api/users', {})),
      firstValueFrom(http.patch('api/users/user-001', {})),
      firstValueFrom(http.delete('api/activities/activity-1')),
    ];

    for (const attempt of attempts) {
      await expect(attempt).rejects.toMatchObject({ status: 405 });
    }
  });
});
