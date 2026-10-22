import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { buildTaskDto, buildUser } from '../../../../testing/builders';
import { errorInterceptor } from '../../../core/http/error.interceptor';
import { ConfirmService } from '../../../shared/ui/confirm/confirm.service';
import { NotificationService } from '../../../shared/ui/notifications/notification.service';
import { provideUi } from '../../../shared/ui/provide-ui';
import { TaskEditorStore } from '../data-access/task-editor.store';
import { TaskEditorDialog } from './task-editor-dialog';
import { expectNoAccessibilityViolations } from '../../../../testing/axe';

describe('TaskEditorDialog', () => {
  let confirm: ReturnType<typeof vi.fn>;

  async function setup() {
    confirm = vi.fn().mockResolvedValue(true);
    await render(TaskEditorDialog, {
      providers: [
        provideUi(),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: ConfirmService, useValue: { confirm } },
        { provide: NotificationService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    });
    const httpTesting = TestBed.inject(HttpTestingController);
    TestBed.tick();
    httpTesting.expectOne('api/tasks').flush({
      tasks: [
        buildTaskDto({
          id: 'task-002',
          title: 'Write docs',
          dueDate: '2999-01-01',
          assignee: buildUser({ id: 'user-001', name: 'John Doe' }),
        }),
      ],
      meta: { totalCount: 1, lastUpdated: '' },
    });
    httpTesting.expectOne('api/users').flush([buildUser({ id: 'user-001', name: 'John Doe' })]);
    await TestBed.inject(ApplicationRef).whenStable();
    return { httpTesting, editor: TestBed.inject(TaskEditorStore) };
  }

  const titleField = () => screen.getByRole('textbox', { name: 'Title' });

  it('edits a task and closes once it is saved', async () => {
    const { httpTesting, editor } = await setup();

    editor.openEdit('task-002');
    expect(await screen.findByRole('dialog', { name: 'Edit task' })).toBeInTheDocument();
    expect(titleField()).toHaveValue('Write docs');

    await userEvent.type(titleField(), ' v2');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    const req = await vi.waitFor(() => httpTesting.expectOne('api/tasks/task-002'));
    expect(req.request.body).toMatchObject({ title: 'Write docs v2' });
    req.flush(buildTaskDto({ id: 'task-002', title: 'Write docs v2' }));

    await vi.waitFor(() => expect(editor.open()).toBe(false));
  });

  it('stays open with the input when saving fails', async () => {
    const { httpTesting, editor } = await setup();
    editor.openEdit('task-002');
    await screen.findByRole('dialog', { name: 'Edit task' });

    await userEvent.type(titleField(), ' v2');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    const req = await vi.waitFor(() => httpTesting.expectOne('api/tasks/task-002'));
    req.flush(null, { status: 500, statusText: 'Server Error' });

    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled(),
    );
    expect(editor.open()).toBe(true);
    expect(titleField()).toHaveValue('Write docs v2');
  });

  it('flags a title already used by another task, using the loaded tasks', async () => {
    const { editor, httpTesting } = await setup();
    editor.openCreate();
    await screen.findByRole('dialog', { name: 'New task' });

    await userEvent.type(titleField(), 'write DOCS');
    await userEvent.tab();

    expect(await screen.findByText('A task with this title already exists.')).toBeInTheDocument();
    httpTesting.expectNone((req) => req.params.has('search'));
  });

  it('closes an untouched form without asking', async () => {
    const { editor } = await setup();
    editor.openCreate();
    await screen.findByRole('dialog', { name: 'New task' });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await vi.waitFor(() => expect(editor.open()).toBe(false));
    expect(confirm).not.toHaveBeenCalled();
  });

  it('asks before discarding changes and keeps editing when told to', async () => {
    const { editor } = await setup();
    editor.openCreate();
    await screen.findByRole('dialog', { name: 'New task' });
    await userEvent.type(titleField(), 'Draft');

    confirm.mockResolvedValueOnce(false);
    await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    await vi.waitFor(() =>
      expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ title: 'Discard changes?' })),
    );
    expect(editor.open()).toBe(true);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await vi.waitFor(() => expect(editor.open()).toBe(false));
  });

  it('has no accessibility violations in the open form', async () => {
    const { editor } = await setup();

    editor.openEdit('task-002');
    await screen.findByRole('dialog', { name: 'Edit task' });

    await expectNoAccessibilityViolations();
  });
});
