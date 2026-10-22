import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { type Observable, of } from 'rxjs';
import { buildTask, buildUser } from '../../../../testing/builders';
import type { Task } from '../../../core/models';
import { provideUi } from '../../../shared/ui/provide-ui';
import { toIsoDate } from '../../../shared/utils/date.utils';
import { TaskForm } from './task-form';

const assignees = [
  { label: 'John Doe', value: 'user-001' },
  { label: 'Sarah Smith', value: 'user-002' },
];

const nextMonthOn15 = (): string => {
  const now = new Date();
  return toIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 15));
};

describe('TaskForm', () => {
  async function setup(
    options: { task?: Task | null; isTitleTaken?: (title: string) => Observable<boolean> } = {},
  ) {
    const saved = vi.fn();
    const cancelled = vi.fn();
    const view = await render(TaskForm, {
      providers: [provideUi()],
      inputs: {
        task: options.task ?? null,
        assignees,
        ...(options.isTitleTaken ? { isTitleTaken: options.isTitleTaken } : {}),
      },
      on: { saved, cancelled },
    });
    return { ...view, saved, cancelled, form: view.fixture.componentInstance };
  }

  const title = () => screen.getByRole('textbox', { name: 'Title' });
  const combobox = (name: string) => screen.getByRole('combobox', { name });

  async function choose(field: string, option: string) {
    // A list that is still closing keeps its options (without pointer events) for a moment;
    // wait for it to go so the option comes from the list opened here.
    await vi.waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    await userEvent.click(combobox(field));
    await userEvent.click(await screen.findByRole('option', { name: option }));
  }

  async function pickDueDateNextMonth() {
    await userEvent.click(combobox('Due date'));
    await userEvent.click(await screen.findByRole('button', { name: 'Next Month' }));
    await userEvent.click(screen.getByText('15'));
  }

  it('creates a task from the filled form', async () => {
    const { saved } = await setup();

    await userEvent.type(title(), '  Plan sprint review  ');
    await choose('Assignee', 'Sarah Smith');
    await pickDueDateNextMonth();
    await userEvent.click(screen.getByRole('button', { name: 'Create task' }));

    await vi.waitFor(() =>
      expect(saved).toHaveBeenCalledWith({
        title: 'Plan sprint review',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: nextMonthOn15(),
        assigneeId: 'user-002',
        tags: [],
        checklist: [],
      }),
    );
  });

  it('shows every error and focuses the first invalid field on submit', async () => {
    const { saved } = await setup();

    await userEvent.click(screen.getByRole('button', { name: 'Create task' }));

    await vi.waitFor(() => expect(title()).toHaveFocus());
    expect(screen.getAllByRole('alert').map((alert) => alert.textContent?.trim())).toEqual([
      'This field is required.',
      'This field is required.',
      'Choose who will work on this task.',
    ]);
    expect(saved).not.toHaveBeenCalled();
  });

  it('rejects a title made only of spaces', async () => {
    await setup();

    await userEvent.type(title(), '   ');
    await userEvent.tab();

    expect(await screen.findByText('Use letters or numbers, not only spaces.')).toBeInTheDocument();
  });

  it('tells the user when the title is already used and does not save', async () => {
    const { saved } = await setup({ isTitleTaken: () => of(true) });

    await userEvent.type(title(), 'Write docs');
    await userEvent.tab();
    await userEvent.click(screen.getByRole('button', { name: 'Create task' }));

    expect(await screen.findByText('A task with this title already exists.')).toBeInTheDocument();
    expect(saved).not.toHaveBeenCalled();
  });

  it('asks for a completion date only while the status is Done', async () => {
    await setup();

    await choose('Status', 'Done');
    expect(await screen.findByRole('combobox', { name: 'Completed on' })).toHaveValue(
      new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    );

    await choose('Status', 'To Do');
    await vi.waitFor(() =>
      expect(screen.queryByRole('combobox', { name: 'Completed on' })).not.toBeInTheDocument(),
    );
  });

  it('edits a task, keeping an overdue due date valid', async () => {
    const task = buildTask({
      id: 'task-009',
      title: 'Security audit',
      description: 'Review the app',
      status: 'done',
      priority: 'high',
      dueDate: '2026-01-10',
      completedAt: '2026-01-09T12:00:00.000Z',
      assignee: buildUser({ id: 'user-001', name: 'John Doe' }),
      tags: ['Security'],
      checklist: [
        { text: 'Scan dependencies', done: true },
        { text: 'Write report', done: false },
      ],
    });
    const { saved, form } = await setup({ task });

    expect(title()).toHaveValue('Security audit');
    expect(screen.getByRole('textbox', { name: 'Checklist item 2' })).toHaveValue('Write report');
    expect(screen.getByText('1/2 done')).toBeInTheDocument();
    expect(form.hasChanges()).toBe(false);
    await userEvent.type(title(), ' v2');
    expect(form.hasChanges()).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await vi.waitFor(() =>
      expect(saved).toHaveBeenCalledWith({
        title: 'Security audit v2',
        description: 'Review the app',
        status: 'done',
        priority: 'high',
        dueDate: '2026-01-10',
        assigneeId: 'user-001',
        tags: ['Security'],
        checklist: [
          { text: 'Scan dependencies', done: true },
          { text: 'Write report', done: false },
        ],
        completedAt: new Date('2026-01-09T12:00:00').toISOString(),
      }),
    );
  });

  describe('checklist', () => {
    const addItem = () => userEvent.click(screen.getByRole('button', { name: '+ Add item' }));
    const item = (position: number) =>
      screen.getByRole('textbox', { name: `Checklist item ${position}` });

    it('adds, ticks and removes rows, and sends the remaining items', async () => {
      const { saved } = await setup();
      await userEvent.type(title(), 'Plan sprint review');
      await choose('Assignee', 'John Doe');
      await pickDueDateNextMonth();

      await addItem();
      await vi.waitFor(() => expect(item(1)).toHaveFocus());
      await userEvent.type(item(1), '  Draft outline ');
      await addItem();
      await userEvent.type(item(2), 'Temporary');
      // The checkbox is named after the row's text, which renders after typing; slow CI
      // machines can take longer than the default second.
      await userEvent.click(
        await screen.findByRole('checkbox', { name: 'Done: Draft outline' }, { timeout: 3000 }),
      );
      await userEvent.click(await screen.findByRole('button', { name: 'Remove checklist item 2' }));

      await vi.waitFor(() =>
        expect(screen.queryByRole('textbox', { name: 'Checklist item 2' })).not.toBeInTheDocument(),
      );
      expect(await screen.findByText('1/1 done')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Create task' }));
      await vi.waitFor(() =>
        expect(saved).toHaveBeenCalledWith(
          expect.objectContaining({ checklist: [{ text: 'Draft outline', done: true }] }),
        ),
      );
    });

    it('requires text in every item', async () => {
      await setup();

      await addItem();
      await userEvent.click(item(1));
      await userEvent.tab();

      expect(await screen.findByText('This field is required.')).toBeInTheDocument();
      expect(item(1)).toHaveAttribute('aria-invalid', 'true');
    });

    it('stops offering new rows at the limit', async () => {
      await setup();

      for (let row = 0; row < 10; row++) {
        await addItem();
      }

      expect(screen.queryByRole('button', { name: '+ Add item' })).not.toBeInTheDocument();
      expect(screen.getByText('A checklist can have up to 10 items.')).toBeInTheDocument();
    });

    it('counts adding a row as a change', async () => {
      const { form } = await setup();

      await addItem();

      expect(form.hasChanges()).toBe(true);
    });
  });

  it('lets the user cancel', async () => {
    const { cancelled } = await setup();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(cancelled).toHaveBeenCalled();
  });
});
