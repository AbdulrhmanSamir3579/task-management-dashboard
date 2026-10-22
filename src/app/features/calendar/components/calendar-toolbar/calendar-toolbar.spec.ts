import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import type { CalendarView } from '../../data-access/calendar-grid';
import { CalendarToolbar } from './calendar-toolbar';

describe('CalendarToolbar', () => {
  async function setup(view: CalendarView = 'month') {
    const handlers = {
      viewChange: vi.fn(),
      previous: vi.fn(),
      next: vi.fn(),
      goToToday: vi.fn(),
    };
    await render(CalendarToolbar, { inputs: { view, label: 'October 2026' }, on: handlers });
    return handlers;
  }

  it('shows the period and marks the current view', async () => {
    await setup('week');

    expect(screen.getByRole('heading', { name: 'October 2026' })).toBeInTheDocument();
    const views = within(screen.getByRole('group', { name: 'Calendar view' }));
    expect(views.getByRole('button', { name: 'Week' })).toHaveAttribute('aria-pressed', 'true');
    expect(views.getByRole('button', { name: 'Month' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('moves between periods and back to today', async () => {
    const { previous, next, goToToday } = await setup('month');

    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    await userEvent.click(screen.getByRole('button', { name: 'Today' }));

    expect(previous).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(goToToday).toHaveBeenCalledTimes(1);
  });

  it('asks for another view', async () => {
    const { viewChange } = await setup();

    await userEvent.click(screen.getByRole('button', { name: 'Agenda' }));

    expect(viewChange).toHaveBeenCalledWith('agenda');
  });

  it('has no period navigation in the agenda', async () => {
    await setup('agenda');

    expect(screen.queryByRole('button', { name: 'Today' })).not.toBeInTheDocument();
  });
});
