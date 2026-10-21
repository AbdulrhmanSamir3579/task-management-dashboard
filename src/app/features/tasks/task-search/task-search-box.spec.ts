import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { buildTaskDto } from '../../../../testing/builders';
import { errorInterceptor } from '../../../core/http/error.interceptor';
import { SEARCH_SUGGESTION_LIMIT, TASK_SEARCH_OPTIONS, TaskSearchBox } from './task-search-box';

describe('TaskSearchBox', () => {
  async function setup() {
    await render(TaskSearchBox, {
      routes: [{ path: '**', children: [] }],
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: TASK_SEARCH_OPTIONS, useValue: { debounceMs: 0 } },
      ],
    });
    return {
      input: screen.getByRole('combobox'),
      httpTesting: TestBed.inject(HttpTestingController),
      router: TestBed.inject(Router),
    };
  }

  const searchRequests = (httpTesting: HttpTestingController) =>
    httpTesting.match((req) => req.url === 'api/tasks' && req.params.has('search'));

  async function searchFor(term: string) {
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

  it('searches with a limit and cancels requests for outdated queries', async () => {
    const { last, earlier } = await searchFor('budget');

    expect(last.request.params.get('limit')).toBe(String(SEARCH_SUGGESTION_LIMIT));
    expect(earlier.every((req) => req.cancelled)).toBe(true);
    last.flush({ tasks: [], meta: { totalCount: 0, lastUpdated: '' } });
  });

  it('shows titles and descriptions with the matched text highlighted', async () => {
    const { last } = await searchFor('budget');

    last.flush({
      tasks: [
        buildTaskDto({
          title: 'Prepare Q4 budget report',
          description: 'Compile the budget presentation',
        }),
      ],
      meta: { totalCount: 1, lastUpdated: '' },
    });

    const option = await screen.findByRole('option', { name: /Prepare Q4 budget report/ });
    const marks = within(option).getAllByText('budget');
    expect(marks).toHaveLength(2);
    expect(marks.every((mark) => mark.tagName === 'MARK')).toBe(true);
    expect(option).toHaveTextContent('Compile the budget presentation');
  });

  it('opens the filtered board when a suggestion is chosen', async () => {
    const { last, router } = await searchFor('budget');
    last.flush({
      tasks: [buildTaskDto({ title: 'Prepare Q4 budget report', description: '' })],
      meta: { totalCount: 1, lastUpdated: '' },
    });

    const option = await screen.findByRole('option', { name: /Prepare Q4 budget report/ });
    await userEvent.click(within(option).getAllByText(/Prepare Q4/)[0]!);

    await vi.waitFor(() => expect(router.url).toBe('/tasks?q=Prepare%20Q4%20budget%20report'));
  });

  it('opens the filtered board with the typed text on Enter', async () => {
    const { input, router, last } = await searchFor('budget');
    last.flush({ tasks: [], meta: { totalCount: 0, lastUpdated: '' } });

    await userEvent.type(input, '{Enter}');

    await vi.waitFor(() => expect(router.url).toBe('/tasks?q=budget'));
  });

  it('tells the user when search fails', async () => {
    const { last } = await searchFor('budget');

    last.flush(null, { status: 500, statusText: 'Server Error' });

    expect(
      await screen.findByText('Search is unavailable right now. Please try again.'),
    ).toBeInTheDocument();
  });
});
