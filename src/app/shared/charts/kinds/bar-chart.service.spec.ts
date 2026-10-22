import { TestBed } from '@angular/core/testing';
import { BarChartService } from './bar-chart.service';

describe('BarChartService', () => {
  const service = () => TestBed.inject(BarChartService);

  it('draws one coloured bar per datum, without a legend', () => {
    const { options, table, empty } = service().build(
      [
        { label: 'High', value: 2, tone: 'danger' },
        { label: 'Low', value: 5, tone: 'success' },
      ],
      { category: 'Priority', value: 'Tasks' },
    );

    expect(empty).toBe(false);
    expect(options).toMatchObject({
      xAxis: { type: 'category', data: ['High', 'Low'] },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'bar',
          name: 'Tasks',
          data: [
            { value: 2, itemStyle: { color: '#d32f2f' } },
            { value: 5, itemStyle: { color: '#388e3c' } },
          ],
        },
      ],
    });
    expect(options.legend).toBeUndefined();
    expect(table).toEqual({
      columns: ['Priority', 'Tasks'],
      rows: [
        ['High', 2],
        ['Low', 5],
      ],
    });
  });

  it('stacks series per category, horizontally with the first category on top', () => {
    const { options, table } = service().buildStacked(
      ['John', 'Sarah'],
      [
        { name: 'To Do', values: [1, 2], tone: 'primary' },
        { name: 'Done', values: [3] },
      ],
      { category: 'Assignee' },
      { horizontal: true },
    );

    expect(options).toMatchObject({
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: ['John', 'Sarah'], inverse: true },
      series: [
        { name: 'To Do', stack: 'total', data: [1, 2] },
        { name: 'Done', stack: 'total', data: [3] },
      ],
    });
    expect(options.legend).toBeDefined();
    expect(table).toEqual({
      columns: ['Assignee', 'To Do', 'Done'],
      rows: [
        ['John', 1, 3],
        ['Sarah', 2, 0],
      ],
    });
  });

  it('is empty when there is nothing to count', () => {
    expect(service().build([], { category: 'Priority' }).empty).toBe(true);
    expect(
      service().buildStacked(['John'], [{ name: 'Done', values: [0] }], { category: 'Assignee' })
        .empty,
    ).toBe(true);
  });
});
