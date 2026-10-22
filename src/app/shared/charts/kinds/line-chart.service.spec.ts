import { TestBed } from '@angular/core/testing';
import { LineChartService } from './line-chart.service';

describe('LineChartService', () => {
  const build = (created: number[], completed: number[]) =>
    TestBed.inject(LineChartService).build(
      ['Mon', 'Tue'],
      [
        { name: 'Created', values: created, tone: 'primary' },
        { name: 'Completed', values: completed, tone: 'success' },
      ],
      { category: 'Day' },
    );

  it('draws one line per series over the categories', () => {
    const { options, empty } = build([2, 1], [0, 3]);

    expect(empty).toBe(false);
    expect(options).toMatchObject({
      xAxis: { type: 'category', data: ['Mon', 'Tue'], boundaryGap: false },
      series: [
        { type: 'line', name: 'Created', data: [2, 1], itemStyle: { color: '#1976d2' } },
        { type: 'line', name: 'Completed', data: [0, 3], itemStyle: { color: '#388e3c' } },
      ],
    });
  });

  it('lists the values per category for screen readers', () => {
    expect(build([2, 1], [0, 3]).table).toEqual({
      columns: ['Day', 'Created', 'Completed'],
      rows: [
        ['Mon', 2, 0],
        ['Tue', 1, 3],
      ],
    });
  });

  it('is empty when every value is zero', () => {
    expect(build([0, 0], [0, 0]).empty).toBe(true);
  });
});
