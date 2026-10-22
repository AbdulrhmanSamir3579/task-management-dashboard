import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { errorInterceptor } from '../../../core/http/error.interceptor';
import { type Activity, CURRENT_USER_ACTOR } from '../../../core/models';
import { TasksStore } from '../../tasks/data-access/tasks.store';
import { ActivityBell } from './activity-bell';

const activity = (id: string, minutesAgo: number, actor = 'Sarah Smith'): Activity => ({
  id,
  type: 'created',
  taskId: `task-${id}`,
  taskTitle: `Task ${id}`,
  actor,
  timestamp: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
});

const feed = [activity('a3', 1, CURRENT_USER_ACTOR), activity('a2', 5), activity('a1', 60)];

describe('ActivityBell', () => {
  let httpTesting: HttpTestingController;
  const settle = () => TestBed.inject(ApplicationRef).whenStable();
  const respond = async (body: Activity[] | null, status = 200) => {
    TestBed.tick();
    httpTesting
      .expectOne((req) => req.url === 'api/activities')
      .flush(body, status === 200 ? {} : { status, statusText: 'Server Error' });
    await settle();
  };

  async function setup() {
    await render(ActivityBell, {
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: TasksStore, useValue: { savedChanges: signal(0) } },
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  }

  afterEach(() => localStorage.clear());

  it('shows how many entries by others are unread', async () => {
    await setup();
    await respond(feed);

    const bell = screen.getByRole('button', { name: 'Notifications, 2 unread' });
    expect(bell).toHaveTextContent('2');
    expect(bell).toHaveAttribute('aria-expanded', 'false');
  });

  it('caps the badge at 9+', async () => {
    await setup();
    await respond(Array.from({ length: 12 }, (_, index) => activity(`b${index}`, index)));

    expect(screen.getByRole('button', { name: 'Notifications, 12 unread' })).toHaveTextContent(
      '9+',
    );
  });

  it('opens the recent activity, marks it as seen and refreshes it', async () => {
    await setup();
    await respond(feed);

    await userEvent.click(screen.getByRole('button', { name: /Notifications/ }));
    const panel = await screen.findByRole('dialog', { name: 'Recent activity' });
    await respond(feed);

    const items = within(panel).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[1]).toHaveTextContent('New: Sarah Smith created Task a2');
    expect(items[1]).toHaveTextContent('5 minutes ago');
    expect(items[0]).not.toHaveTextContent('New:');
    expect(screen.getByRole('button', { name: 'Notifications' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('keeps the feed seen after the page is loaded again', async () => {
    await setup();
    await respond(feed);
    await userEvent.click(screen.getByRole('button', { name: /Notifications/ }));
    await respond(feed);

    expect(localStorage.getItem('task-manager.activity.last-seen')).toBe(feed[0]?.timestamp);
  });

  it('shows a placeholder while loading and a retry when loading fails', async () => {
    await setup();
    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    const panel = await screen.findByRole('dialog', { name: 'Recent activity' });
    expect(within(panel).getByRole('status', { name: 'Loading recent activity' })).toBeTruthy();

    await respond(null, 500);
    // Opening asked for the feed again before the first answer arrived.
    httpTesting.match((req) => req.url === 'api/activities');
    await settle();

    expect(await within(panel).findByRole('alert')).toHaveTextContent(
      'Something went wrong on our side.',
    );
    await userEvent.click(within(panel).getByRole('button', { name: 'Try again' }));
    await respond(feed);
    expect(within(panel).getAllByRole('listitem')).toHaveLength(3);
  });
});
