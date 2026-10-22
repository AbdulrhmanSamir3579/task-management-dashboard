import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { render } from '@testing-library/angular';
import { ConfirmService } from '../../shared/ui/confirm/confirm.service';
import { NotificationService } from '../../shared/ui/notifications/notification.service';
import { TasksStore } from './data-access/tasks.store';
import { TasksPage } from './tasks.page';

describe('TasksPage', () => {
  async function setup(inputs: Partial<Record<'q' | 'status' | 'priority' | 'assignee', string>>) {
    const { fixture } = await render(TasksPage, {
      inputs,
      routes: [{ path: '**', children: [] }],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfirmService, useValue: { confirm: vi.fn() } },
        { provide: NotificationService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    });
    TestBed.tick();
    return {
      fixture,
      store: TestBed.inject(TasksStore),
      router: TestBed.inject(Router),
    };
  }

  it('uses the filters from the url', async () => {
    const { store } = await setup({
      q: 'budget',
      status: 'done',
      priority: 'high,low',
      assignee: 'user-002',
    });

    expect(store.filters()).toEqual({
      search: 'budget',
      statuses: ['done'],
      priorities: ['high', 'low'],
      assigneeId: 'user-002',
    });
  });

  it('follows the url when it changes from outside', async () => {
    const { fixture, store } = await setup({ q: 'budget' });

    fixture.componentRef.setInput('q', undefined);
    fixture.componentRef.setInput('priority', 'low');
    TestBed.tick();

    expect(store.filters().search).toBe('');
    expect(store.filters().priorities).toEqual(['low']);
  });

  it('writes filter changes to the url without a history entry', async () => {
    const { store, router } = await setup({});
    const navigate = vi.spyOn(router, 'navigate');

    store.setFilters({ statuses: ['done'], priorities: ['high'] });

    await vi.waitFor(() => expect(router.url).toBe('/?status=done&priority=high'));
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ replaceUrl: true }));
  });

  it('keeps a search typed while the url catches up', async () => {
    const { fixture, store, router } = await setup({});
    store.setFilters({ search: 'bud' });
    await vi.waitFor(() => expect(router.url).toBe('/?q=bud'));

    // The user types on while the router hands the written param back to the page.
    store.setFilters({ search: 'budget' });
    fixture.componentRef.setInput('q', 'bud');
    TestBed.tick();

    expect(store.filters().search).toBe('budget');
    await vi.waitFor(() => expect(router.url).toBe('/?q=budget'));
  });
});
