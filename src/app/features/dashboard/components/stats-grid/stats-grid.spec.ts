import { render, screen } from '@testing-library/angular';
import type { Statistic } from '../../../../core/models';
import { StatsGrid } from './stats-grid';

const stat = (id: string, title: string): Statistic => ({
  id,
  title,
  icon: '📊',
  value: 1,
  change: '0',
  changeLabel: 'today',
  changeType: 'neutral',
  color: '#1976D2',
});

describe('StatsGrid', () => {
  it('shows skeleton cards while loading', async () => {
    await render(StatsGrid);

    expect(screen.getAllByRole('status', { name: 'Loading statistics' })).toHaveLength(4);
  });

  it('shows a card per statistic', async () => {
    await render(StatsGrid, {
      inputs: { stats: [stat('a', 'Total Tasks'), stat('b', 'Completed')] },
    });

    expect(screen.getByRole('region', { name: 'Task statistics' })).toBeInTheDocument();
    expect(screen.getAllByRole('article').map((card) => card.getAttribute('aria-label'))).toEqual([
      'Total Tasks',
      'Completed',
    ]);
  });
});
