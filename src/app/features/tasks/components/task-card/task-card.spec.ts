import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { buildTask, buildUser } from '../../../../../testing/builders';
import type { Task } from '../../../../core/models';
import type { TaskChangeState } from '../../data-access/tasks.store';
import { TaskCard } from './task-card';

describe('TaskCard', () => {
  async function setup(task: Partial<Task> = {}, changeState?: TaskChangeState) {
    const editRequest = vi.fn();
    const moveRequest = vi.fn();
    const deleteRequest = vi.fn();
    const { fixture } = await render(TaskCard, {
      inputs: {
        task: buildTask({
          title: 'Prepare Q4 budget report',
          description: 'Compile the financial data',
          priority: 'high',
          dueDate: '2026-10-23',
          tags: ['Finance', 'Critical'],
          assignee: buildUser({ name: 'Sarah Smith', avatar: 'SS' }),
          ...task,
        }),
        changeState,
        today: '2026-10-21',
      },
      on: { editRequest, moveRequest, deleteRequest },
    });
    return { host: fixture.nativeElement as HTMLElement, editRequest, moveRequest, deleteRequest };
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
});
