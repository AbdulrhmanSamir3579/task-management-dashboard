import { render, screen, within } from '@testing-library/angular';
import { provideChartsForTesting } from '../../../../testing/charts';
import type { ChartConfig } from '../chart.models';
import { UiChart } from './chart';

const config: ChartConfig = {
  options: { series: [{ type: 'pie', data: [{ name: 'Done', value: 2 }] }] },
  table: {
    columns: ['Status', 'Tasks'],
    rows: [
      ['To Do', 3],
      ['Done', 2],
    ],
  },
  empty: false,
};

describe('UiChart', () => {
  async function setup(chartConfig: ChartConfig = config) {
    const { provider, init, chart } = provideChartsForTesting();
    const view = await render(UiChart, {
      inputs: { config: chartConfig, label: 'Tasks by status' },
      providers: [provider],
    });
    return { ...view, init, chart };
  }

  it('draws the options with the SVG renderer', async () => {
    const { init, chart } = await setup();

    await vi.waitFor(() => expect(chart.setOption).toHaveBeenCalledWith(config.options, true));
    expect(init).toHaveBeenCalledWith(expect.any(HTMLElement), undefined, { renderer: 'svg' });
  });

  it('gives screen readers the same numbers as a table', async () => {
    await setup();

    const figure = screen.getByRole('figure', { name: 'Tasks by status' });
    const table = within(figure).getByRole('table', { name: 'Tasks by status' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Status', 'Tasks']);
    expect(within(table).getByRole('rowheader', { name: 'Done' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: '3' })).toBeInTheDocument();
  });

  it('hides the table through a wrapper, since tables ignore a 1px height', async () => {
    await setup();

    const table = screen.getByRole('table', { name: 'Tasks by status' });
    expect(table).not.toHaveClass('visually-hidden');
    expect(table.parentElement).toHaveClass('visually-hidden');
    expect(table.parentElement?.tagName).toBe('DIV');
  });

  it('shows a message instead of an empty chart', async () => {
    const { init } = await setup({ ...config, empty: true });

    expect(screen.getByText('Nothing to show yet.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(init).not.toHaveBeenCalled();
  });
});
