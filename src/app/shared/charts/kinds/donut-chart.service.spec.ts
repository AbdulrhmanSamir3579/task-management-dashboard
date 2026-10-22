import { TestBed } from '@angular/core/testing';
import { DonutChartService } from './donut-chart.service';

describe('DonutChartService', () => {
  const build = (values: number[]) =>
    TestBed.inject(DonutChartService).build(
      [
        { label: 'To Do', value: values[0] ?? 0, tone: 'primary' },
        { label: 'Done', value: values[1] ?? 0 },
      ],
      { category: 'Status', value: 'Tasks' },
    );

  it('draws one slice per datum with the total in the middle', () => {
    const { options, empty } = build([3, 1]);

    expect(empty).toBe(false);
    expect(options).toMatchObject({
      title: { text: '4', subtext: 'Tasks' },
      series: [
        {
          type: 'pie',
          data: [
            { name: 'To Do', value: 3, itemStyle: { color: '#1976d2' } },
            { name: 'Done', value: 1 },
          ],
        },
      ],
    });
  });

  it('lists each part with its share for screen readers', () => {
    expect(build([3, 1]).table).toEqual({
      columns: ['Status', 'Tasks', 'Share'],
      rows: [
        ['To Do', 3, '75%'],
        ['Done', 1, '25%'],
      ],
    });
  });

  it('is empty when every value is zero', () => {
    const { empty, table } = build([0, 0]);

    expect(empty).toBe(true);
    expect(table.rows[0]).toEqual(['To Do', 0, '0%']);
  });
});
