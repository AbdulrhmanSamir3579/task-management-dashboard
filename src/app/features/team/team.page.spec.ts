import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { buildTaskDto, buildUser } from '../../../testing/builders';
import { errorInterceptor } from '../../core/http/error.interceptor';
import type { TasksResponse, User } from '../../core/models';
import { NotificationService } from '../../shared/ui/notifications/notification.service';
import { TaskEditorStore } from '../tasks/data-access/task-editor.store';
import { TasksStore } from '../tasks/data-access/tasks.store';
import { TeamPage } from './team.page';
import { expectNoAccessibilityViolations } from '../../../testing/axe';

const john = buildUser({ id: 'user-001', name: 'John Doe', avatar: 'JD' });
const sarah = buildUser({ id: 'user-002', name: 'Sarah Smith', avatar: 'SS' });

const tasks: TasksResponse = {
  tasks: [
    buildTaskDto({ id: 'a', status: 'todo', assignee: john, dueDate: '2000-01-01' }),
    buildTaskDto({ id: 'b', status: 'done', assignee: john }),
  ],
  meta: { totalCount: 2, lastUpdated: '' },
};

describe('TeamPage', () => {
  let httpTesting: HttpTestingController;
  const settle = () => TestBed.inject(ApplicationRef).whenStable();
  const serverError = { status: 500, statusText: 'Server Error' };

  async function setup() {
    const { navigate } = await render(TeamPage, {
      routes: [{ path: '**', children: [] }],
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    });
    await navigate('/team');
    httpTesting = TestBed.inject(HttpTestingController);
    TestBed.tick();
  }

  async function respond(users: User[] | null, taskList: TasksResponse | null) {
    httpTesting.expectOne('api/users').flush(users, users ? {} : serverError);
    httpTesting.expectOne('api/tasks').flush(taskList, taskList ? {} : serverError);
    await settle();
  }

  it('shows placeholders until people and tasks have loaded', async () => {
    await setup();

    expect(screen.getByRole('status', { name: 'Loading the team' })).toBeInTheDocument();
  });

  it('shows every member with their workload', async () => {
    await setup();
    await respond([john, sarah], tasks);

    expect(screen.getByText('2 members · 1 open task · 1 overdue')).toBeInTheDocument();
    const johnCard = screen.getByRole('article', { name: 'John Doe' });
    expect(
      within(johnCard).getByRole('progressbar', { name: 'Tasks completed by John Doe' }),
    ).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByRole('article', { name: 'Sarah Smith' })).toBeInTheDocument();
  });

  it('follows changes made on the board', async () => {
    await setup();
    await respond([john, sarah], tasks);

    TestBed.inject(TasksStore).move('a', 'done', 0);
    TestBed.tick();

    const johnCard = screen.getByRole('article', { name: 'John Doe' });
    expect(within(johnCard).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('opens a new task assigned to the chosen member', async () => {
    await setup();
    await respond([john, sarah], tasks);

    await userEvent.click(screen.getByRole('button', { name: 'Assign task to Sarah Smith' }));

    const editor = TestBed.inject(TaskEditorStore);
    expect([editor.open(), editor.taskId(), editor.assigneeId()]).toEqual([true, null, 'user-002']);
  });

  it('says when there is nobody on the team', async () => {
    await setup();
    await respond([], tasks);

    expect(screen.getByRole('heading', { name: 'No team members yet' })).toBeInTheDocument();
  });

  it('offers a retry that loads only what failed', async () => {
    await setup();
    await respond(null, tasks);

    expect(
      await screen.findByRole('heading', { name: 'The team could not be loaded' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    TestBed.tick();
    httpTesting.expectOne('api/users').flush([john]);
    httpTesting.expectNone('api/tasks');
    await settle();

    expect(screen.getByRole('article', { name: 'John Doe' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    await setup();
    await respond([john, sarah], tasks);

    await expectNoAccessibilityViolations();
  });
});
