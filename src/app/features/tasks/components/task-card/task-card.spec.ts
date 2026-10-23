import { DeferBlockBehavior } from '@angular/core/testing';
import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { buildTask, buildUser } from '../../../../../testing/builders';
import { provideArabicForTesting } from '../../../../../testing/i18n';
import type { Task, User } from '../../../../core/models';
import { expectNoAccessibilityViolations } from '../../../../../testing/axe';
import type { TaskChangeState } from '../../data-access/tasks.store';
import { TaskCard } from './task-card';

const sarah = buildUser({ id: 'user-001', name: 'Sarah Smith', avatar: 'SS' });
const team = [
  sarah,
  buildUser({ id: 'user-002', name: 'Mike Johnson', avatar: 'MJ' }),
  buildUser({ id: 'user-003', name: 'Emily Davis', avatar: 'ED' }),
];

describe('TaskCard', () => {
  async function setup(
    task: Partial<Task> = {},
    changeState?: TaskChangeState,
    extra: { assignees?: User[]; isTitleTaken?: (title: string, id: string) => boolean } = {},
  ) {
    const editRequest = vi.fn();
    const moveRequest = vi.fn();
    const deleteRequest = vi.fn();
    const quickEdit = vi.fn();
    const { fixture } = await render(TaskCard, {
      deferBlockBehavior: DeferBlockBehavior.Playthrough,
      inputs: {
        task: buildTask({
          title: 'Prepare Q4 budget report',
          description: 'Compile the financial data',
          priority: 'high',
          dueDate: '2026-10-23',
          tags: ['Finance', 'Critical'],
          assignee: sarah,
          ...task,
        }),
        changeState,
        today: '2026-10-21',
        ...extra,
      },
      on: { editRequest, moveRequest, deleteRequest, quickEdit },
    });
    return {
      host: fixture.nativeElement as HTMLElement,
      editRequest,
      moveRequest,
      deleteRequest,
      quickEdit,
    };
  }

  async function chooseAction(label: string) {
    await userEvent.click(
      screen.getByRole('button', { name: 'Actions for Prepare Q4 budget report' }),
    );
    const item = await screen.findByRole('menuitem', { name: label });
    await userEvent.click(within(item).getByText(label));
  }

  it('shows the task details from the design', async () => {
    await setup();

    const card = screen.getByRole('article', { name: 'Prepare Q4 budget report' });
    expect(
      within(card).getByRole('heading', { name: 'Prepare Q4 budget report' }),
    ).toBeInTheDocument();
    expect(card).toHaveTextContent('High');
    expect(card).toHaveTextContent('Compile the financial data');
    expect(card).toHaveTextContent('Due in 2 days');
    expect(card).toHaveTextContent('Finance, Critical');
    expect(card).toHaveTextContent('@Sarah');
    expect(screen.getByLabelText('Sarah Smith')).toHaveTextContent('SS');
  });

  it('highlights overdue tasks', async () => {
    const { host } = await setup({ isOverdue: true, dueDate: '2026-10-19' });

    expect(host).toHaveClass('task-card--overdue');
    expect(host).toHaveTextContent('Overdue by 2 days');
  });

  it('leaves out an empty description, tags and checklist', async () => {
    await setup({ description: '', tags: [], checklist: [] });

    const card = screen.getByRole('article');
    expect(card).not.toHaveTextContent('Compile');
    expect(card).not.toHaveTextContent('🏷️');
    expect(card).not.toHaveTextContent('checklist');
  });

  it('shows checklist progress', async () => {
    await setup({
      checklist: [
        { text: 'Collect numbers', done: true },
        { text: 'Draft slides', done: true },
        { text: 'Review', done: false },
      ],
    });

    expect(screen.getByRole('article')).toHaveTextContent('2/3 checklist items done');
  });

  it.each<[TaskChangeState, string]>([
    ['saving', 'task-card--saving'],
    ['saved', 'task-card--saved'],
    ['failed', 'task-card--failed'],
  ])('shows the %s state', async (state, cssClass) => {
    const { host } = await setup({}, state);

    expect(host).toHaveClass(cssClass);
    expect(host.getAttribute('aria-busy')).toBe(state === 'saving' ? 'true' : null);
  });

  it('offers moves to the other columns', async () => {
    const { moveRequest } = await setup({ status: 'todo' });

    await chooseAction('Move to In Progress');

    expect(moveRequest).toHaveBeenCalledWith('in_progress');
    expect(screen.queryByRole('menuitem', { name: 'Move to To Do' })).not.toBeInTheDocument();
  });

  it('asks to edit', async () => {
    const { editRequest } = await setup();

    await chooseAction('Edit');

    expect(editRequest).toHaveBeenCalled();
  });

  it('asks to delete', async () => {
    const { deleteRequest } = await setup();

    await chooseAction('Delete');

    expect(deleteRequest).toHaveBeenCalled();
  });

  describe('inline title editing', () => {
    const editButton = () =>
      screen.getByRole('button', { name: 'Edit title of Prepare Q4 budget report' });
    const titleInput = () => screen.getByRole('textbox', { name: 'Task title' });

    it('saves a new title with Enter and puts focus back on the edit button', async () => {
      const { quickEdit } = await setup();

      await userEvent.click(editButton());
      expect(titleInput()).toHaveValue('Prepare Q4 budget report');
      await vi.waitFor(() => expect(titleInput()).toHaveFocus());
      expect(screen.getByText('Enter to save, Esc to cancel')).toBeInTheDocument();

      await userEvent.clear(titleInput());
      await userEvent.type(titleInput(), '  Prepare Q4 budget  {Enter}');

      expect(quickEdit).toHaveBeenCalledExactlyOnceWith({ title: 'Prepare Q4 budget' });
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      await vi.waitFor(() => expect(editButton()).toHaveFocus());
    });

    it('cancels with Escape', async () => {
      const { quickEdit } = await setup();

      await userEvent.click(editButton());
      await userEvent.type(titleInput(), ' and more{Escape}');

      expect(quickEdit).not.toHaveBeenCalled();
      expect(screen.getByRole('heading', { name: 'Prepare Q4 budget report' })).toBeInTheDocument();
      await vi.waitFor(() => expect(editButton()).toHaveFocus());
    });

    it('opens with a double click and saves when focus leaves the field', async () => {
      const { quickEdit } = await setup();

      await userEvent.dblClick(screen.getByRole('heading', { name: 'Prepare Q4 budget report' }));
      await userEvent.type(titleInput(), ' v2');
      await userEvent.tab();

      expect(quickEdit).toHaveBeenCalledWith({ title: 'Prepare Q4 budget report v2' });
    });

    it('sends nothing when the title did not change', async () => {
      const { quickEdit } = await setup();

      await userEvent.click(editButton());
      await userEvent.type(titleInput(), '{Enter}');

      expect(quickEdit).not.toHaveBeenCalled();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('keeps an invalid title open with its error', async () => {
      const isTitleTaken = vi.fn((title: string) => title === 'Hire designer');
      const { quickEdit } = await setup({}, undefined, { isTitleTaken });

      await userEvent.click(editButton());
      await userEvent.clear(titleInput());
      await userEvent.type(titleInput(), '   {Enter}');
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Use letters or numbers, not only spaces.',
      );

      await userEvent.clear(titleInput());
      await userEvent.type(titleInput(), 'Hire designer');
      await userEvent.tab();

      expect(isTitleTaken).toHaveBeenCalledWith('Hire designer', 'task-001');
      expect(screen.getByRole('alert')).toHaveTextContent('A task with this title already exists.');
      expect(titleInput()).toBeInTheDocument();
      expect(quickEdit).not.toHaveBeenCalled();
    });

    it('limits the title length', async () => {
      await setup();

      await userEvent.click(editButton());

      expect(titleInput()).toHaveAttribute('maxlength', '100');
    });

    it('has no accessibility violations while editing', async () => {
      await setup();

      await userEvent.click(editButton());

      await expectNoAccessibilityViolations();
    });
  });

  describe('inline priority and assignee', () => {
    it('changes the priority from the priority chip', async () => {
      const { quickEdit } = await setup();

      const chip = screen.getByRole('button', {
        name: 'High priority. Change priority of Prepare Q4 budget report',
      });
      expect(chip).toHaveTextContent('High');
      await userEvent.click(chip);
      const item = await screen.findByRole('menuitem', { name: 'Low' });
      expect(screen.queryByRole('menuitem', { name: 'High' })).not.toBeInTheDocument();
      await userEvent.click(within(item).getByText('Low'));

      expect(quickEdit).toHaveBeenCalledWith({ priority: 'low' });
    });

    it('gives the task to someone else, listing the other people by name', async () => {
      const { quickEdit } = await setup({}, undefined, { assignees: team });

      await userEvent.click(
        screen.getByRole('button', {
          name: 'Assigned to Sarah Smith. Change assignee of Prepare Q4 budget report',
        }),
      );
      const items = await screen.findAllByRole('menuitem');
      expect(items.map((item) => item.textContent?.trim())).toEqual([
        'Emily Davis',
        'Mike Johnson',
      ]);
      await userEvent.click(within(items[1]!).getByText('Mike Johnson'));

      expect(quickEdit).toHaveBeenCalledWith({ assignee: team[1] });
    });

    it('shows the assignee as plain text when nobody else can take the task', async () => {
      await setup();

      expect(screen.queryByRole('button', { name: /Change assignee/ })).not.toBeInTheDocument();
      expect(screen.getByRole('article')).toHaveTextContent('@Sarah');
    });
  });

  it('shows its texts in Arabic, with Arabic plural forms', async () => {
    await render(TaskCard, {
      deferBlockBehavior: DeferBlockBehavior.Playthrough,
      inputs: {
        task: buildTask({
          title: 'Prepare Q4 budget report',
          priority: 'high',
          dueDate: '2026-10-19',
        }),
        today: '2026-10-21',
      },
      providers: [provideArabicForTesting()],
    });

    expect(screen.getByText('عالية')).toBeInTheDocument();
    // Two days late: Arabic uses its dual form here, not "2 days".
    expect(screen.getByText(/متأخرة يومين/)).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'إجراءات «Prepare Q4 budget report»' }),
    );
    expect(
      await screen.findByRole('menuitem', { name: 'نقل إلى قيد التنفيذ' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'تعديل عنوان «Prepare Q4 budget report»' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'أولوية عالية. تغيير أولوية «Prepare Q4 budget report»' }),
    ).toBeInTheDocument();
  });
});
