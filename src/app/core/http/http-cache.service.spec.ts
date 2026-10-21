import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom } from 'rxjs';
import { CLOCK } from '../time/clock';
import { HttpCacheService } from './http-cache.service';

describe('HttpCacheService', () => {
  let cache: HttpCacheService;
  let now: number;

  const response = (body: unknown) => new HttpResponse({ body, status: 200 });

  beforeEach(() => {
    now = Date.UTC(2026, 9, 21, 12);
    TestBed.configureTestingModule({
      providers: [{ provide: CLOCK, useValue: () => new Date(now) }],
    });
    cache = TestBed.inject(HttpCacheService);
  });

  it('returns nothing for unknown keys', () => {
    expect(cache.get('api/tasks')).toBeUndefined();
  });

  it('returns a stored response until its time to live runs out', () => {
    cache.set('api/tasks', response({ tasks: [] }), 1000);

    now += 999;
    expect(cache.get('api/tasks')?.body).toEqual({ tasks: [] });

    now += 1;
    expect(cache.get('api/tasks')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it('hands out copies so callers cannot change the stored body', () => {
    cache.set('api/tasks', response({ tasks: ['a'] }), 1000);

    (cache.get('api/tasks')?.body as { tasks: string[] }).tasks.push('mutated');

    expect(cache.get('api/tasks')?.body).toEqual({ tasks: ['a'] });
  });

  it('invalidates a collection without touching similarly named ones', () => {
    for (const key of [
      'api/tasks',
      'api/tasks/1',
      'api/tasks?status=done',
      'api/tasks-archive',
      'api/users',
    ]) {
      cache.set(key, response(key), 1000);
    }

    cache.invalidate('api/tasks');

    expect(
      ['api/tasks', 'api/tasks/1', 'api/tasks?status=done'].map((key) => cache.get(key)),
    ).toEqual([undefined, undefined, undefined]);
    expect(cache.get('api/tasks-archive')).toBeDefined();
    expect(cache.get('api/users')).toBeDefined();
  });

  it('clears everything', () => {
    cache.set('api/tasks', response(1), 1000);
    cache.set('api/users', response(2), 1000);

    cache.clear();

    expect(cache.size).toBe(0);
  });

  it('shares one in-flight request between concurrent callers and releases it afterwards', async () => {
    let subscriptions = 0;
    const request = new Observable<HttpResponse<unknown>>((subscriber) => {
      subscriptions++;
      setTimeout(() => {
        subscriber.next(response('done'));
        subscriber.complete();
      });
    });

    const [first, second] = await Promise.all([
      firstValueFrom(cache.dedupe('api/tasks', request)),
      firstValueFrom(cache.dedupe('api/tasks', request)),
    ]);

    expect(subscriptions).toBe(1);
    expect(first).toBe(second);

    await firstValueFrom(cache.dedupe('api/tasks', request));
    expect(subscriptions).toBe(2);
  });
});
