import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, type Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { buildTaskDto, buildUser } from '../../../testing/builders';
import { provideChartsForTesting } from '../../../testing/charts';
import { provideArabicForTesting } from '../../../testing/i18n';
import { errorInterceptor } from '../../core/http/error.interceptor';
import type { TasksResponse } from '../../core/models';
import { NotificationService } from '../../shared/ui/notifications/notification.service';
import { TasksStore } from '../tasks/data-access/tasks.store';
import { AnalyticsPage } from './analytics.page';
import { expectNoAccessibilityViolations } from '../../../testing/axe';

const tasks: TasksResponse = {
  tasks: [
    buildTaskDto({ id: 'a', status: 'todo', priority: 'high' }),
    buildTaskDto({ id: 'b', status: 'done', priority: 'high' }),
    buildTaskDto({
      id: 'c',
      status: 'in_progress',
      priority: 'low',
      assignee: buildUser({ id: 'user-002', name: 'Sarah Smith' }),
    }),
  ],
  meta: { totalCount: 3, lastUpdated: '' },
};

describe('AnalyticsPage', () => {
  async function setup(extraProviders: Provider[] = []) {
    const charts = provideChartsForTesting();
    await render(AnalyticsPage, {
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: { success: vi.fn(), error: vi.fn() } },
        ...extraProviders,
      ],
      componentProviders: [charts.provider],
    });
    const httpTesting = TestBed.inject(HttpTestingController);
    const respond = async (body: TasksResponse | null, status = 200) => {
      TestBed.tick();
      httpTesting
        .expectOne('api/tasks')
        .flush(body, status === 200 ? {} : { status, statusText: 'Server Error' });
      await TestBed.inject(ApplicationRef).whenStable();
    };
    return { respond, chart: charts.chart, store: TestBed.inject(TasksStore) };
  }

  const table = (name: string) =>
    within(screen.getByRole('figure', { name })).getByRole('table', { name });

  it('shows a placeholder for each chart until the tasks arrive', async () => {
    await setup();

    expect(screen.getAllByRole('status', { name: 'Loading chart' })).toHaveLength(4);
  });

  it('charts the tasks by status, priority, assignee and day', async () => {
    const { respond, chart } = await setup();
    await respond(tasks);

    expect(within(table('Tasks by status')).getByRole('row', { name: 'Done 1 33%' })).toBeTruthy();
    expect(within(table('Tasks by priority')).getByRole('row', { name: 'High 2' })).toBeTruthy();
    expect(
      within(table('Workload by assignee')).getByRole('row', { name: 'John Doe 1 0 1' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('figure', { name: 'Tasks created and completed per day' }),
    ).toBeTruthy();
    await vi.waitFor(() => expect(chart.setOption).toHaveBeenCalled());
  });

  it('follows changes to the tasks', async () => {
    const { respond, store } = await setup();
    await respond(tasks);

    store.move('a', 'done', 0);
    TestBed.tick();

    expect(within(table('Tasks by status')).getByRole('row', { name: 'Done 2 67%' })).toBeTruthy();
  });

  it('offers a retry when the tasks cannot be loaded', async () => {
    const { respond } = await setup();
    await respond(null, 500);

    expect(
      await screen.findByRole('heading', { name: 'Analytics could not be loaded' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await respond(tasks);

    expect(await screen.findByRole('figure', { name: 'Tasks by status' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { respond } = await setup();
    await respond(tasks);

    await expectNoAccessibilityViolations();
  });

  it('labels the charts and their tables in Arabic', async () => {
    const { respond } = await setup([provideArabicForTesting()]);
    await respond(tasks);

    const statusTable = table('المهام حسب الحالة');
    expect(
      within(statusTable)
        .getAllByRole('columnheader')
        .map((th) => th.textContent),
    ).toEqual(['الحالة', 'المهام', 'النسبة']);
    expect(within(statusTable).getByRole('row', { name: 'مكتملة 1 33%' })).toBeTruthy();
  });
});
