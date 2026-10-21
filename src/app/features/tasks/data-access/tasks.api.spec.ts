import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { buildTaskDto } from '../../../../testing/builders';
import type { CreateTaskPayload, TasksResponse } from '../../../core/models';
import { TasksApi } from './tasks.api';

describe('TasksApi', () => {
  let api: TasksApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(TasksApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads the task list as a resource', async () => {
    const response: TasksResponse = {
      tasks: [buildTaskDto()],
      meta: { totalCount: 1, lastUpdated: '2026-10-21T10:00:00.000Z' },
    };
    const resource = TestBed.runInInjectionContext(() => api.listResource());
    TestBed.tick();

    httpTesting.expectOne('api/tasks').flush(response);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(resource.value()).toEqual(response);
  });

  it('creates a task', async () => {
    const payload: CreateTaskPayload = {
      title: 'New',
      description: '',
      status: 'todo',
      priority: 'low',
      dueDate: '2026-10-30',
      assigneeId: 'user-001',
      tags: [],
    };
    const created = firstValueFrom(api.create(payload));

    const req = httpTesting.expectOne('api/tasks');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(buildTaskDto({ title: 'New' }));

    expect((await created).title).toBe('New');
  });

  it('updates a task with only the changed fields', async () => {
    const updated = firstValueFrom(api.update('task-001', { status: 'done' }));

    const req = httpTesting.expectOne('api/tasks/task-001');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'done' });
    req.flush(buildTaskDto({ status: 'done' }));

    expect((await updated).status).toBe('done');
  });

  it('deletes a task', async () => {
    const removed = firstValueFrom(api.remove('task-001'), { defaultValue: undefined });

    const req = httpTesting.expectOne('api/tasks/task-001');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    await expect(removed).resolves.toBeNull();
  });
});
