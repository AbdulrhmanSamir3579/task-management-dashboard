import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { buildTaskDto } from '../../../../testing/builders';
import { UsersStore } from '../../../core/data-access/users.store';
import { errorInterceptor } from '../../../core/http/error.interceptor';
import type { TasksResponse } from '../../../core/models';
import { ConfirmService } from '../../../shared/ui/confirm/confirm.service';
import { NotificationService } from '../../../shared/ui/notifications/notification.service';
import { TaskBoard } from '../components/task-board/task-board';
import { TaskEditorStore } from '../data-access/task-editor.store';
import { TasksStore } from '../data-access/tasks.store';
import { TaskBoardSection } from './task-board-section';

const tasks: TasksResponse = {
  tasks: [
    buildTaskDto({ id: 'task-001', title: 'Prepare budget', status: 'todo', position: 0 }),
    buildTaskDto({ id: 'task-002', title: 'Write docs', status: 'todo', position: 1 }),
    buildTaskDto({ id: 'task-003', title: 'Security audit', status: 'done', position: 0 }),
  ],
  meta: { totalCount: 3, lastUpdated: '2026-10-21T10:00:00.000Z' },
};

const assignees = [
  { label: 'John Doe', value: 'user-001' },
  { label: 'Sarah Smith', value: 'user-002' },
];

describe('TaskBoardSection', () => {
  let confirm: ReturnType<typeof vi.fn>;

  async function setup() {
    confirm = vi.fn().mockResolvedValue(true);
    const view = await render(TaskBoardSection, {
      routes: [{ path: '**', children: [] }],
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: ConfirmService, useValue: { confirm } },
        { provide: NotificationService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: UsersStore, useValue: { options: signal(assignees) } },
      ],
    });
    const httpTesting = TestBed.inject(HttpTestingController);
    const settle = () => TestBed.inject(ApplicationRef).whenStable();
    return { ...view, httpTesting, settle, store: TestBed.inject(TasksStore) };
  }

  async function loaded() {
    const context = await setup();
    TestBed.tick();
    context.httpTesting.expectOne('api/tasks').flush(tasks);
    await context.settle();
    return context;
  }

  it('shows a skeleton board until the tasks arrive', async () => {
    const { httpTesting, settle } = await setup();
    expect(screen.getByRole('status', { name: 'Loading tasks' })).toBeInTheDocument();

    TestBed.tick();
    httpTesting.expectOne('api/tasks').flush(tasks);
    await settle();

    expect(screen.queryByRole('status', { name: 'Loading tasks' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'To Do' })).toBeInTheDocument();
  });

  it('offers a retry when loading fails', async () => {
    const { httpTesting, settle } = await setup();
    TestBed.tick();
    httpTesting.expectOne('api/tasks').flush(null, { status: 404, statusText: 'Not Found' });
    await settle();

    expect(
      await screen.findByRole('heading', { name: 'Tasks could not be loaded' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    TestBed.tick();
    httpTesting.expectOne('api/tasks').flush(tasks);
    await settle();

    expect(await screen.findByRole('region', { name: 'Done' })).toBeInTheDocument();
  });

  it('shows only the column of the selected status tab', async () => {
    await loaded();

    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    await vi.waitFor(() =>
      expect(screen.queryByRole('region', { name: 'To Do' })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('region', { name: 'Done' })).toBeInTheDocument();
  });

  it('filters by assignee from the toolbar dropdown', async () => {
    const { store } = await loaded();

    const toolbar = screen.getByRole('group', { name: 'Show tasks by status' }).parentElement!;
    await userEvent.click(within(toolbar).getByRole('combobox', { name: 'Assignee' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Sarah Smith' }));

    expect(store.filters().assigneeId).toBe('user-002');
    // Every task in this board belongs to John, so nothing is left.
    expect(
      await screen.findByRole('heading', { name: 'No tasks match your filters' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(store.filters().assigneeId).toBeNull();
  });

  it('moves a dropped card through the store', async () => {
    const { fixture, httpTesting } = await loaded();

    fixture.debugElement.query(By.directive(TaskBoard)).componentInstance.dropped.emit({
      taskId: 'task-003',
      status: 'todo',
      beforeTaskId: 'task-002',
    });

    const req = httpTesting.expectOne('api/tasks/task-003');
    expect(req.request.body).toEqual({ status: 'todo', position: 1 });
    req.flush(buildTaskDto({ id: 'task-003', status: 'todo', position: 1 }));
  });

  it('moves a card to the end of a column from its menu', async () => {
    const { httpTesting } = await loaded();

    await userEvent.click(screen.getByRole('button', { name: 'Actions for Security audit' }));
    const item = await screen.findByRole('menuitem', { name: 'Move to To Do' });
    await userEvent.click(within(item).getByText('Move to To Do'));

    const req = httpTesting.expectOne('api/tasks/task-003');
    expect(req.request.body).toEqual({ status: 'todo', position: 2 });
    req.flush(buildTaskDto({ id: 'task-003', status: 'todo', position: 2 }));
  });

  it('deletes a task only after confirmation', async () => {
    const { httpTesting } = await loaded();
    const deleteViaMenu = async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Actions for Write docs' }));
      const item = await screen.findByRole('menuitem', { name: 'Delete' });
      await userEvent.click(within(item).getByText('Delete'));
    };

    confirm.mockResolvedValueOnce(false);
    await deleteViaMenu();
    await vi.waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
    httpTesting.expectNone('api/tasks/task-002');

    await deleteViaMenu();
    await vi.waitFor(() =>
      httpTesting
        .expectOne('api/tasks/task-002')
        .flush(null, { status: 204, statusText: 'No Content' }),
    );
    expect(confirm).toHaveBeenLastCalledWith(
      expect.objectContaining({ tone: 'danger', confirmLabel: 'Delete' }),
    );
  });

  it('opens the task form for a new task and for editing', async () => {
    await loaded();
    const editor = TestBed.inject(TaskEditorStore);

    await userEvent.click(screen.getByRole('button', { name: '+ New Task' }));
    expect([editor.open(), editor.taskId()]).toEqual([true, null]);

    editor.close();
    await userEvent.click(screen.getByRole('button', { name: 'Actions for Write docs' }));
    const item = await screen.findByRole('menuitem', { name: 'Edit' });
    await userEvent.click(within(item).getByText('Edit'));
    expect([editor.open(), editor.taskId()]).toEqual([true, 'task-002']);
  });

  it('shows the active search with a way to clear it', async () => {
    const { store } = await loaded();

    store.setFilters({ search: 'budget' });

    expect(await screen.findByText(/Showing results for “budget”/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(store.filters().search).toBe('');
  });

  it('explains when no task matches and clears the filters', async () => {
    const { store } = await loaded();

    store.setFilters({ search: 'nothing like this' });

    expect(
      await screen.findByRole('heading', { name: 'No tasks match your filters' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(store.hasActiveFilters()).toBe(false);
  });
});
