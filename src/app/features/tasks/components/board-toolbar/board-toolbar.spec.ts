import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import type { TaskStatus } from '../../../../core/models';
import { BoardToolbar } from './board-toolbar';

describe('BoardToolbar', () => {
  async function setup(status: TaskStatus | null = null) {
    const statusChange = vi.fn();
    await render(BoardToolbar, { inputs: { status }, on: { statusChange } });
    return { statusChange };
  }

  it('shows a tab per status with All selected by default', async () => {
    await setup();

    const group = screen.getByRole('group', { name: 'Show tasks by status' });
    expect(group).toHaveTextContent('All To Do In Progress Done');
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Done' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('marks the selected status', async () => {
    await setup('in_progress');

    expect(screen.getByRole('button', { name: 'In Progress' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the chosen tab', async () => {
    const { statusChange } = await setup('done');

    await userEvent.click(screen.getByRole('button', { name: 'To Do' }));
    await userEvent.click(screen.getByRole('button', { name: 'All' }));

    expect(statusChange.mock.calls).toEqual([['todo'], [null]]);
  });
});
