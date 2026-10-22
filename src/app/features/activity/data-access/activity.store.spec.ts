import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  type TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { errorInterceptor } from '../../../core/http/error.interceptor';
import { type Activity, CURRENT_USER_ACTOR } from '../../../core/models';
import { BrowserStorage } from '../../../core/storage/browser-storage';
import { TasksStore } from '../../tasks/data-access/tasks.store';
import { ACTIVITY_FEED_LIMIT, ActivityStore, LAST_SEEN_STORAGE_KEY } from './activity.store';

const activity = (id: string, timestamp: string, actor = 'Sarah Smith'): Activity => ({
  id,
  type: 'updated',
  taskId: 'task-001',
  taskTitle: 'Prepare budget',
  actor,
  timestamp,
});

const feed = [
  activity('a3', '2026-10-22T09:00:00.000Z', CURRENT_USER_ACTOR),
  activity('a2', '2026-10-22T08:00:00.000Z'),
  activity('a1', '2026-10-21T08:00:00.000Z'),
];

describe('ActivityStore', () => {
  let httpTesting: HttpTestingController;
  const savedChanges = signal(0);
  const stored = new Map<string, string>();
  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  function createStore() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: TasksStore, useValue: { savedChanges } },
        {
          provide: BrowserStorage,
          useValue: {
            get: (key: string) => stored.get(key) ?? null,
            set: (key: string, value: string) => stored.set(key, value),
          },
        },
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    const store = TestBed.inject(ActivityStore);
    TestBed.tick();
    return store;
  }

  const feedRequest = (): TestRequest =>
    httpTesting.expectOne((req) => req.url === 'api/activities');

  async function loadedStore() {
    const store = createStore();
    feedRequest().flush(feed);
    await settle();
    return store;
  }

  afterEach(() => {
    httpTesting.verify();
    stored.clear();
    savedChanges.set(0);
  });

  it('loads the newest entries of the feed', async () => {
    const store = createStore();
    expect(store.isLoading()).toBe(true);

    const request = feedRequest();
    expect(request.request.params.get('limit')).toBe(String(ACTIVITY_FEED_LIMIT));
    request.flush(feed);
    await settle();

    expect(store.hasLoaded()).toBe(true);
    expect(store.activities().map((entry) => entry.id)).toEqual(['a3', 'a2', 'a1']);
  });

  it('counts changes by others as unread until the feed is seen', async () => {
    const store = await loadedStore();
    expect(store.unreadCount()).toBe(2);

    store.markAllSeen();

    expect(store.unreadCount()).toBe(0);
    expect(stored.get(LAST_SEEN_STORAGE_KEY)).toBe('2026-10-22T09:00:00.000Z');
  });

  it('remembers what was seen across page loads', async () => {
    stored.set(LAST_SEEN_STORAGE_KEY, '2026-10-21T12:00:00.000Z');

    const store = await loadedStore();

    expect(store.lastSeenAt()).toBe('2026-10-21T12:00:00.000Z');
    expect(store.unreadCount()).toBe(1);
  });

  it('loads the feed again when the server accepts a task change', async () => {
    const store = await loadedStore();

    savedChanges.set(1);
    TestBed.tick();
    feedRequest().flush([activity('a4', '2026-10-22T10:00:00.000Z'), ...feed]);
    await settle();

    expect(store.activities()).toHaveLength(4);
    expect(store.unreadCount()).toBe(3);
  });

  it('reports a failed load and recovers on reload', async () => {
    const store = createStore();
    feedRequest().flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(store.loadError()).toBe('Something went wrong on our side. Please try again.');
    store.markAllSeen();
    expect(stored.size).toBe(0);

    store.reload();
    TestBed.tick();
    feedRequest().flush(feed);
    await settle();
    expect(store.loadError()).toBeNull();
  });
});
