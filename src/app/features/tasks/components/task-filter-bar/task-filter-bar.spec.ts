import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { EMPTY_TASK_FILTERS, type TaskFilters } from '../../data-access/task-filters';
import { TaskFilterBar } from './task-filter-bar';

const assignees = [
  { label: 'John Doe', value: 'user-001' },
  { label: 'Sarah Smith', value: 'user-002' },
];

describe('TaskFilterBar', () => {
  async function setup(filters: TaskFilters = EMPTY_TASK_FILTERS) {
    const filtersChange = vi.fn();
    const view = await render(TaskFilterBar, {
      inputs: { filters, assignees },
      on: { filtersChange },
    });
    return { ...view, filtersChange };
  }

  const combobox = (name: string) => screen.getByRole('combobox', { name });

  it('reports a chosen priority with the other filters', async () => {
    const { filtersChange } = await setup({ ...EMPTY_TASK_FILTERS, assigneeId: 'user-002' });

    combobox('Priority').focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.click(await screen.findByRole('option', { name: 'High' }));

    expect(filtersChange).toHaveBeenLastCalledWith({
      priorities: ['high'],
      assigneeId: 'user-002',
    });
  });

  it('reports a chosen assignee', async () => {
    const { filtersChange } = await setup();

    await userEvent.click(combobox('Assignee'));
    await userEvent.click(await screen.findByRole('option', { name: 'Sarah Smith' }));

    expect(filtersChange).toHaveBeenLastCalledWith({ priorities: [], assigneeId: 'user-002' });
  });

  it('shows filters changed from outside without reporting them back', async () => {
    const { filtersChange, rerender } = await setup();

    await rerender({
      inputs: { filters: { ...EMPTY_TASK_FILTERS, priorities: ['low'], assigneeId: 'user-001' } },
      partialUpdate: true,
    });

    expect(await screen.findByText('Low')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(filtersChange).not.toHaveBeenCalled();
  });
});
