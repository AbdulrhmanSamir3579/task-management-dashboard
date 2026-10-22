import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { buildTaskDto } from '../../../testing/builders';
import { errorInterceptor } from '../../core/http/error.interceptor';
import type { TasksResponse } from '../../core/models';
import { NotificationService } from '../../shared/ui/notifications/notification.service';
import { addDaysToIsoDate, toIsoDate } from '../../shared/utils/date.utils';
import { TaskEditorStore } from '../tasks/data-access/task-editor.store';
import { TasksStore } from '../tasks/data-access/tasks.store';
import { CalendarPage } from './calendar.page';

const today = toIsoDate(new Date());

const tasks: TasksResponse = {
  tasks: [
    buildTaskDto({ id: 'a', title: 'Prepare budget', dueDate: addDaysToIsoDate(today, -1) }),
    buildTaskDto({ id: 'b', title: 'Write docs', dueDate: addDaysToIsoDate(today, 3) }),
    buildTaskDto({ id: 'c', title: 'Old release', status: 'done' }),
  ],
  meta: { totalCount: 3, lastUpdated: '' },
};

describe('CalendarPage', () => {
  async function setup() {
    await render(CalendarPage, {
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    });
    const httpTesting = TestBed.inject(HttpTestingController);
    const respond = async (body: TasksResponse | null) => {
      TestBed.tick();
      httpTesting
        .expectOne('api/tasks')
        .flush(body, body ? {} : { status: 500, statusText: 'Server Error' });
      await TestBed.inject(ApplicationRef).whenStable();
    };
    return { respond };
  }

  it('shows placeholders until the tasks arrive', async () => {
    await setup();

    expect(screen.getByRole('status', { name: 'Loading the agenda' })).toBeInTheDocument();
  });

  it('lists open tasks by when they are due and opens one for editing', async () => {
    const { respond } = await setup();
    await respond(tasks);

    expect(screen.getByRole('region', { name: 'Overdue 1' })).toHaveTextContent('Prepare budget');
    expect(screen.getByRole('region', { name: 'Next 7 days 1' })).toHaveTextContent('Write docs');
    expect(screen.queryByText('Old release')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Write docs' }));
    const editor = TestBed.inject(TaskEditorStore);
    expect([editor.open(), editor.taskId()]).toEqual([true, 'b']);
  });

  it('follows changes made on the board', async () => {
    const { respond } = await setup();
    await respond(tasks);

    TestBed.inject(TasksStore).move('a', 'done', 0);
    TestBed.tick();

    expect(screen.queryByRole('region', { name: /Overdue/ })).not.toBeInTheDocument();
  });

  it('celebrates when nothing is due and offers a new task', async () => {
    const { respond } = await setup();
    await respond({ tasks: [tasks.tasks[2]!], meta: { totalCount: 1, lastUpdated: '' } });

    expect(screen.getByRole('heading', { name: 'Nothing due' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '+ New Task' }));
    expect(TestBed.inject(TaskEditorStore).open()).toBe(true);
  });

  it('offers a retry when the tasks cannot be loaded', async () => {
    const { respond } = await setup();
    await respond(null);

    expect(
      await screen.findByRole('heading', { name: 'The agenda could not be loaded' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await respond(tasks);

    expect(await screen.findByRole('region', { name: 'Overdue 1' })).toBeInTheDocument();
  });
});
