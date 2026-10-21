import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { GlobalSearch } from './global-search';

describe('GlobalSearch', () => {
  async function setup() {
    await render(GlobalSearch, { routes: [{ path: '**', children: [] }] });
    return {
      input: screen.getByRole('searchbox', { name: 'Search tasks' }),
      router: TestBed.inject(Router),
    };
  }

  it('opens the tasks page filtered by the trimmed query', async () => {
    const { input, router } = await setup();

    await userEvent.type(input, '  budget {Enter}');

    await vi.waitFor(() => expect(router.url).toBe('/tasks?q=budget'));
  });

  it('opens the unfiltered tasks page for an empty query', async () => {
    const { input, router } = await setup();

    await userEvent.type(input, '   {Enter}');

    await vi.waitFor(() => expect(router.url).toBe('/tasks'));
  });

  it('is announced as the search landmark', async () => {
    await setup();
    expect(screen.getByRole('search')).toBeInTheDocument();
  });
});
