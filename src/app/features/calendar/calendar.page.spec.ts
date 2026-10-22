import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { buildTaskDto } from '../../../testing/builders';
import { errorInterceptor } from '../../core/http/error.interceptor';
import type { TasksResponse } from '../../core/models';
import { NotificationService } from '../../shared/ui/notifications/notification.service';
import {
  addDaysToIsoDate,
  addMonthsToIsoDate,
  fromIsoDate,
  toIsoDate,
} from '../../shared/utils/date.utils';
import { TaskEditorStore } from '../tasks/data-access/task-editor.store';
import { TasksStore } from '../tasks/data-access/tasks.store';
import { CalendarPage } from './calendar.page';
import { expectNoAccessibilityViolations } from '../../../testing/axe';

const today = toIsoDate(new Date());
const monthName = (date: string) =>
  new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(fromIsoDate(date));
const fullDate = (date: string) =>
  new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(
    fromIsoDate(date),
  );

const tasks: TasksResponse = {
  tasks: [
    buildTaskDto({ id: 'a', title: 'Prepare budget', dueDate: addDaysToIsoDate(today, -1) }),
    buildTaskDto({ id: 'b', title: 'Write docs', dueDate: today }),
    buildTaskDto({ id: 'c', title: 'Old release', status: 'done', dueDate: today }),
  ],
  meta: { totalCount: 3, lastUpdated: '' },
};

describe('CalendarPage', () => {
  async function setup(inputs: { view?: string; date?: string } = {}) {
    const { fixture, navigate } = await render(CalendarPage, {
      inputs,
      routes: [{ path: '**', children: [] }],
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    });
    await navigate('/calendar');
    const httpTesting = TestBed.inject(HttpTestingController);
    const respond = async (body: TasksResponse | null = tasks) => {
      TestBed.tick();
      httpTesting
        .expectOne('api/tasks')
        .flush(body, body ? {} : { status: 500, statusText: 'Server Error' });
      await TestBed.inject(ApplicationRef).whenStable();
    };
    return { fixture, respond, router: TestBed.inject(Router) };
  }

  it('shows a placeholder until the tasks arrive', async () => {
    await setup();

    expect(screen.getByRole('status', { name: 'Loading the calendar' })).toBeInTheDocument();
  });

  it('opens on this month, with tasks on their days', async () => {
    const { respond } = await setup();
    await respond();

    expect(screen.getByRole('heading', { name: monthName(today) })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Tasks due each day' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Write docs' }));
    const editor = TestBed.inject(TaskEditorStore);
    expect([editor.open(), editor.taskId()]).toEqual([true, 'b']);
  });

  it('switches views and periods through the url', async () => {
    const { respond, router } = await setup();
    await respond();

    await userEvent.click(screen.getByRole('button', { name: 'Week' }));
    await vi.waitFor(() => expect(router.url).toBe('/calendar?view=week'));

    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    const next = addMonthsToIsoDate(today, 1);
    await vi.waitFor(() => expect(router.url).toBe(`/calendar?date=${next}`));
  });

  it('shows the week and the agenda for the view in the url', async () => {
    const { fixture, respond } = await setup({ view: 'week' });
    await respond();

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(7);

    fixture.componentRef.setInput('view', 'agenda');
    TestBed.tick();
    expect(screen.getByRole('region', { name: 'Overdue 1' })).toHaveTextContent('Prepare budget');
    expect(screen.queryByText('Old release')).not.toBeInTheDocument();
  });

  it('falls back to this month for an unknown view or date', async () => {
    const { respond } = await setup({ view: 'year', date: '2026-02-30' });
    await respond();

    expect(screen.getByRole('heading', { name: monthName(today) })).toBeInTheDocument();
  });

  it('goes back to today from another period', async () => {
    const lastMonth = addMonthsToIsoDate(today, -1);
    const { respond, router } = await setup({ date: lastMonth });
    await respond();
    expect(screen.getByRole('heading', { name: monthName(lastMonth) })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Today' }));

    await vi.waitFor(() => expect(router.url).toBe('/calendar'));
  });

  it('adds a task due on the chosen day', async () => {
    const { respond } = await setup();
    await respond();

    await userEvent.click(screen.getByRole('button', { name: `Add task on ${fullDate(today)}` }));

    const editor = TestBed.inject(TaskEditorStore);
    expect([editor.open(), editor.taskId(), editor.dueDate()]).toEqual([true, null, today]);
  });

  it('opens the week of a day whose tasks do not all fit', async () => {
    const busy = Array.from({ length: 5 }, (_, index) =>
      buildTaskDto({ id: `t${index}`, title: `Task ${index}`, dueDate: today }),
    );
    const { respond, router } = await setup();
    await respond({ tasks: busy, meta: { totalCount: 5, lastUpdated: '' } });

    await userEvent.click(screen.getByRole('button', { name: `+2 more on ${fullDate(today)}` }));

    await vi.waitFor(() => expect(router.url).toBe('/calendar?view=week'));
  });

  it('follows changes made on the board', async () => {
    const { fixture, respond } = await setup({ view: 'agenda' });
    await respond();

    TestBed.inject(TasksStore).move('a', 'done', 0);
    TestBed.tick();
    fixture.detectChanges();

    expect(screen.queryByRole('region', { name: /Overdue/ })).not.toBeInTheDocument();
  });

  it('celebrates in the agenda when nothing is due', async () => {
    const { respond } = await setup({ view: 'agenda' });
    await respond({ tasks: [tasks.tasks[2]!], meta: { totalCount: 1, lastUpdated: '' } });

    expect(screen.getByRole('heading', { name: 'Nothing due' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '+ New Task' }));
    expect(TestBed.inject(TaskEditorStore).open()).toBe(true);
  });

  it('offers a retry when the tasks cannot be loaded', async () => {
    const { respond } = await setup();
    await respond(null);

    expect(
      await screen.findByRole('heading', { name: 'The calendar could not be loaded' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await respond();

    expect(await screen.findByRole('table', { name: 'Tasks due each day' })).toBeInTheDocument();
  });

  it.each(['month', 'week', 'agenda'])(
    'has no accessibility violations in the %s view',
    async (view) => {
      const { respond } = await setup({ view });
      await respond();

      await expectNoAccessibilityViolations();
    },
  );
});
