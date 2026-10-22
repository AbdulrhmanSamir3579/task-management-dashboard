import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { buildTask, buildUser } from '../../../../../testing/builders';
import type { AgendaGroup } from '../../data-access/agenda';
import { AgendaList } from './agenda-list';

const groups: AgendaGroup[] = [
  {
    id: 'overdue',
    title: 'CALENDAR.GROUP.OVERDUE',
    tasks: [
      buildTask({
        id: 'task-001',
        title: 'Prepare budget',
        dueDate: '2026-10-20',
        priority: 'high',
        assignee: buildUser({ name: 'Sarah Smith', avatar: 'SS' }),
      }),
    ],
  },
  {
    id: 'week',
    title: 'CALENDAR.GROUP.WEEK',
    tasks: [
      buildTask({ id: 'task-002', title: 'Write docs', dueDate: '2026-10-24', priority: 'low' }),
      buildTask({ id: 'task-003', title: 'Plan sprint', dueDate: '2026-10-25' }),
    ],
  },
];

describe('AgendaList', () => {
  async function setup() {
    const taskOpen = vi.fn();
    await render(AgendaList, { inputs: { groups, today: '2026-10-22' }, on: { taskOpen } });
    return { taskOpen };
  }

  it('shows each group with its number of tasks', async () => {
    await setup();

    const overdue = screen.getByRole('region', { name: 'Overdue 1' });
    expect(within(overdue).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('region', { name: 'Next 7 days 2' })).toBeInTheDocument();
  });

  it('shows when each task is due, its priority and who has it', async () => {
    await setup();

    const [item] = within(screen.getByRole('region', { name: 'Overdue 1' })).getAllByRole(
      'listitem',
    );
    expect(item).toHaveTextContent('Tue20Oct');
    expect(within(item!).getByText('Tue').closest('time')).toHaveAttribute(
      'datetime',
      '2026-10-20',
    );
    expect(item).toHaveTextContent('Overdue by 2 days · To Do');
    expect(item).toHaveTextContent('High');
    expect(within(item!).getByLabelText('Sarah Smith')).toBeInTheDocument();
  });

  it('asks to open a task when its title is chosen', async () => {
    const { taskOpen } = await setup();

    await userEvent.click(screen.getByRole('button', { name: 'Write docs' }));

    expect(taskOpen).toHaveBeenCalledWith('task-002');
  });
});
