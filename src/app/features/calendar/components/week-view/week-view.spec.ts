import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { buildTask, buildUser } from '../../../../../testing/builders';
import { weekDays } from '../../data-access/calendar-grid';
import { WeekView } from './week-view';

const today = '2026-10-22';

describe('WeekView', () => {
  async function setup() {
    const handlers = { taskOpen: vi.fn(), dayAdd: vi.fn() };
    const days = weekDays(
      today,
      [
        buildTask({
          id: 'a',
          title: 'Prepare budget',
          dueDate: today,
          priority: 'high',
          assignee: buildUser({ name: 'Sarah Smith', avatar: 'SS' }),
        }),
        buildTask({ id: 'b', title: 'Release notes', dueDate: '2026-10-20', status: 'done' }),
      ],
      today,
    );
    await render(WeekView, { inputs: { days }, on: handlers });
    return handlers;
  }

  const day = (name: string) =>
    screen
      .getAllByRole('listitem')
      .find((item) => item.querySelector('h3')?.textContent?.includes(name))!;

  it('shows the seven days, today marked', async () => {
    await setup();

    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(7);
    expect(headings[0]).toHaveAccessibleName('Monday, October 19');
    expect(day('Thursday, October 22')).toHaveAttribute('aria-current', 'date');
  });

  it('shows each task with its priority and assignee, and opens it', async () => {
    const { taskOpen } = await setup();

    const thursday = day('Thursday, October 22');
    expect(thursday).toHaveTextContent('High');
    expect(within(thursday).getByLabelText('Sarah Smith')).toBeInTheDocument();
    await userEvent.click(within(thursday).getByRole('button', { name: 'Prepare budget' }));

    expect(taskOpen).toHaveBeenCalledWith('a');
  });

  it('names done tasks as done and says when a day is free', async () => {
    await setup();

    expect(screen.getByRole('button', { name: 'Release notes, done' })).toBeInTheDocument();
    expect(day('Friday, October 23')).toHaveTextContent('No tasks');
  });

  it('offers to add a task from today on', async () => {
    const { dayAdd } = await setup();

    await userEvent.click(screen.getByRole('button', { name: 'Add task on Sunday, October 25' }));

    expect(dayAdd).toHaveBeenCalledWith('2026-10-25');
    expect(
      screen.queryByRole('button', { name: 'Add task on Monday, October 19' }),
    ).not.toBeInTheDocument();
  });
});
