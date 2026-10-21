import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { buildTaskDto } from '../../../../testing/builders';
import { errorInterceptor } from '../../../core/http/error.interceptor';
import type { TasksResponse } from '../../../core/models';
import { NotificationService } from '../../../shared/ui/notifications/notification.service';
import { TasksStore } from '../data-access/tasks.store';
import { SEARCH_SUGGESTION_LIMIT, TASK_SEARCH_OPTIONS, TaskSearchBox } from './task-search-box';

const loadedTasks: TasksResponse = {
  tasks: [
    buildTaskDto({
      id: 'task-001',
      title: 'Prepare Q4 budget report',
      description: 'Compile the budget presentation',
    }),
    buildTaskDto({
      id: 'task-002',
      title: 'Write docs',
      description: 'Review the API documentation',
    }),
  ],
  meta: { totalCount: 2, lastUpdated: '' },
};

describe('TaskSearchBox', () => {
  async function setup(url = '/dashboard') {
    const { navigate } = await render(TaskSearchBox, {
      routes: [
        { path: 'tasks', children: [] },
        { path: '**', children: [] },
      ],
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: TASK_SEARCH_OPTIONS, useValue: { debounceMs: 0 } },
        { provide: NotificationService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    });
    await navigate(url);
    const httpTesting = TestBed.inject(HttpTestingController);
    return {
      input: screen.getByRole('combobox'),
      httpTesting,
      router: TestBed.inject(Router),
      store: TestBed.inject(TasksStore),
      /** Answers the board's initial load, so search can use the loaded tasks. */
      loadTasks: async () => {
        TestBed.tick();
        httpTesting
          .expectOne((req) => req.url === 'api/tasks' && !req.params.has('search'))
          .flush(loadedTasks);
        await TestBed.inject(ApplicationRef).whenStable();
      },
    };
  }

  const searchRequests = (httpTesting: HttpTestingController) =>
    httpTesting.match((req) => req.url === 'api/tasks' && req.params.has('search'));

  async function searchApiFor(term: string) {
    const context = await setup();
    await userEvent.type(context.input, term);
    let last: ReturnType<typeof searchRequests>[number] | undefined;
    const earlier: ReturnType<typeof searchRequests> = [];
    await vi.waitFor(() => {
      const requests = searchRequests(context.httpTesting);
      earlier.push(...requests.filter((req) => req.request.params.get('search') !== term));
      last = requests.find((req) => req.request.params.get('search') === term) ?? last;
      expect(last).toBeDefined();
    });
    return { ...context, last: last!, earlier };
  }

  it('is labelled as the task search landmark', async () => {
    await setup();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByLabelText('Search tasks')).toBeInTheDocument();
  });

  describe('before the tasks are loaded', () => {
    it('asks the API with a limit and cancels requests for outdated queries', async () => {
      const { last, earlier } = await searchApiFor('budget');

      expect(last.request.params.get('limit')).toBe(String(SEARCH_SUGGESTION_LIMIT));
      expect(earlier.every((req) => req.cancelled)).toBe(true);
      last.flush({ tasks: [], meta: { totalCount: 0, lastUpdated: '' } });
    });

    it('shows titles and descriptions with the matched text highlighted', async () => {
      const { last } = await searchApiFor('budget');

      last.flush(loadedTasks);

      const option = await screen.findByRole('option', { name: /Prepare Q4 budget report/ });
      const marks = within(option).getAllByText('budget');
      expect(marks).toHaveLength(2);
      expect(marks.every((mark) => mark.tagName === 'MARK')).toBe(true);
    });

    it('tells the user when search fails', async () => {
      const { last } = await searchApiFor('budget');

      last.flush(null, { status: 500, statusText: 'Server Error' });

      expect(
        await screen.findByText('Search is unavailable right now. Please try again.'),
      ).toBeInTheDocument();
    });
  });

  describe('once the tasks are loaded', () => {
    it('suggests from the loaded tasks without asking the API', async () => {
      const { input, httpTesting, loadTasks } = await setup();
      await loadTasks();

      await userEvent.type(input, 'docu');

      const option = await screen.findByRole('option', { name: /Write docs/ });
      expect(within(option).getByText('docu').tagName).toBe('MARK');
      expect(searchRequests(httpTesting)).toEqual([]);
    });
  });

  describe('on the Tasks page', () => {
    it('filters the board on every keystroke and keeps ?q= in step', async () => {
      const { input, store, router, loadTasks } = await setup('/tasks');
      await loadTasks();

      await userEvent.type(input, 'bud');

      expect(store.filters().search).toBe('bud');
      await vi.waitFor(() => expect(router.url).toBe('/tasks?q=bud'));
    });

    it('clears the box when the search is cleared on the page', async () => {
      const { input, store, loadTasks } = await setup('/tasks');
      await loadTasks();
      await userEvent.type(input, 'budget');

      store.setFilters({ search: '' });

      await vi.waitFor(() => expect(input).toHaveValue(''));
    });
  });

  it('does not filter the board while typing on other pages', async () => {
    const { input, store, loadTasks } = await setup('/dashboard');
    await loadTasks();

    await userEvent.type(input, 'budget');

    expect(store.filters().search).toBe('');
  });

  it('opens the filtered board when a suggestion is chosen', async () => {
    const { input, router, loadTasks } = await setup();
    await loadTasks();

    await userEvent.type(input, 'budget');
    const option = await screen.findByRole('option', { name: /Prepare Q4 budget report/ });
    await userEvent.click(within(option).getAllByText(/Prepare Q4/)[0]!);

    await vi.waitFor(() => expect(router.url).toBe('/tasks?q=Prepare%20Q4%20budget%20report'));
  });

  it('opens the filtered board with the typed text on Enter', async () => {
    const { input, router, loadTasks } = await setup();
    await loadTasks();

    await userEvent.type(input, 'budget{Enter}');

    await vi.waitFor(() => expect(router.url).toBe('/tasks?q=budget'));
  });
});
