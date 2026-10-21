import { render, screen } from '@testing-library/angular';
import type { Statistic } from '../../../../core/models';
import { StatCard } from './stat-card';

const stat: Statistic = {
  id: 'overdue',
  title: 'Overdue',
  icon: '⚠️',
  value: 3,
  change: '+1',
  changeLabel: 'today',
  changeType: 'negative',
  color: '#D32F2F',
};

describe('StatCard', () => {
  it('shows the title, value and change', async () => {
    await render(StatCard, { inputs: { stat } });

    const card = screen.getByRole('article', { name: 'Overdue' });
    expect(card).toHaveTextContent('Overdue');
    expect(card).toHaveTextContent('3');
    expect(screen.getByText('+1 today')).toHaveClass('stat__change', 'stat__change--negative');
  });

  it.each(['positive', 'neutral'] as const)('colours a %s change', async (changeType) => {
    await render(StatCard, { inputs: { stat: { ...stat, changeType } } });
    expect(screen.getByText('+1 today')).toHaveClass(`stat__change--${changeType}`);
  });
});
