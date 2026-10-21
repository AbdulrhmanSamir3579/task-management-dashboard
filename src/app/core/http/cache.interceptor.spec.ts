import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { CLOCK } from '../time/clock';
import { cacheInterceptor, collectionOf, invalidates, withCache } from './cache.interceptor';
import { API_BASE_URL } from './http-base.service';

describe('cacheInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let now: number;

  beforeEach(() => {
    now = Date.UTC(2026, 9, 21, 12);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([cacheInterceptor])),
        provideHttpClientTesting(),
        { provide: CLOCK, useValue: () => new Date(now) },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  const cachedGet = (url = 'api/tasks', ttlMs = 1000) =>
    firstValueFrom(http.get(url, { context: withCache({ ttlMs }) }));

  async function primeCache(url = 'api/tasks', body: object = { tasks: [] }): Promise<void> {
    const request = cachedGet(url);
    httpTesting.expectOne(url).flush(body);
    await request;
  }

  it('does not cache requests that did not opt in', () => {
    http.get('api/tasks').subscribe();
    httpTesting.expectOne('api/tasks').flush({});
    http.get('api/tasks').subscribe();
    httpTesting.expectOne('api/tasks').flush({});
  });

  it('serves a cached response without hitting the network', async () => {
    await primeCache('api/tasks', { tasks: ['a'] });

    expect(await cachedGet()).toEqual({ tasks: ['a'] });
    httpTesting.expectNone('api/tasks');
  });

  it('fetches again once the entry has expired', async () => {
    await primeCache();
    now += 1000;

    cachedGet().catch(() => undefined);
    httpTesting.expectOne('api/tasks').flush({});
  });

  it('uses the full url with params as the key', async () => {
    await primeCache('api/tasks?status=done');

    cachedGet('api/tasks?status=todo').catch(() => undefined);
    httpTesting.expectOne('api/tasks?status=todo').flush({});
  });

  it('sends one request for concurrent identical calls', async () => {
    const first = cachedGet();
    const second = cachedGet();

    httpTesting.expectOne('api/tasks').flush({ tasks: [] });

    expect(await Promise.all([first, second])).toEqual([{ tasks: [] }, { tasks: [] }]);
  });

  it('never caches errors', async () => {
    const failed = cachedGet();
    httpTesting.expectOne('api/tasks').flush(null, { status: 503, statusText: 'Unavailable' });
    await expect(failed).rejects.toMatchObject({ status: 503 });

    cachedGet().catch(() => undefined);
    httpTesting.expectOne('api/tasks').flush({});
  });

  it('clears the collection after a successful mutation', async () => {
    await primeCache();

    http.patch('api/tasks/task-001', { status: 'done' }).subscribe();
    httpTesting.expectOne('api/tasks/task-001').flush({});

    cachedGet().catch(() => undefined);
    httpTesting.expectOne('api/tasks').flush({});
  });

  it('keeps the cache when a mutation fails', async () => {
    await primeCache();

    http.delete('api/tasks/task-001').subscribe({ error: () => undefined });
    httpTesting
      .expectOne('api/tasks/task-001')
      .flush(null, { status: 500, statusText: 'Server Error' });

    await cachedGet();
    httpTesting.expectNone('api/tasks');
  });

  it('also clears related collections declared with invalidates()', async () => {
    await primeCache('api/activities', []);

    http.post('api/tasks', {}, { context: invalidates(['activities']) }).subscribe();
    httpTesting.expectOne('api/tasks').flush({});

    cachedGet('api/activities').catch(() => undefined);
    httpTesting.expectOne('api/activities').flush([]);
  });
});

describe('cacheInterceptor with a base url ending in a slash', () => {
  it('still clears related collections', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([cacheInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'api/' },
      ],
    });
    const http = TestBed.inject(HttpClient);
    const httpTesting = TestBed.inject(HttpTestingController);
    const getActivities = () =>
      firstValueFrom(http.get('api/activities', { context: withCache() }));

    const primed = getActivities();
    httpTesting.expectOne('api/activities').flush([]);
    await primed;

    http.post('api/tasks', {}, { context: invalidates(['activities']) }).subscribe();
    httpTesting.expectOne('api/tasks').flush({});

    getActivities().catch(() => undefined);
    httpTesting.expectOne('api/activities').flush([]);
    httpTesting.verify();
  });
});

describe('collectionOf', () => {
  it.each([
    ['api/tasks/task-001?x=1', 'api', 'api/tasks'],
    ['api/tasks', 'api/', 'api/tasks'],
    ['https://x.dev/v1/users/7', 'https://x.dev/v1', 'https://x.dev/v1/users'],
    ['/tasks/1', '', '/tasks'],
    ['https://cdn.dev/data.json', 'api', 'https://cdn.dev/data.json'],
  ])('maps %s with base %j to %s', (url, base, expected) => {
    expect(collectionOf(url, base)).toBe(expected);
  });
});
