import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  RETRY_CONFIG,
  type RetryConfig,
  backoffDelay,
  retryInterceptor,
} from './retry.interceptor';

describe('retryInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  function setup(config?: RetryConfig): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([retryInterceptor])),
        provideHttpClientTesting(),
        ...(config ? [{ provide: RETRY_CONFIG, useValue: config }] : []),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  }

  const failWith = (status: number) =>
    httpTesting.expectOne('api/tasks').flush(null, { status, statusText: 'Error' });

  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    httpTesting.verify();
    vi.useRealTimers();
  });

  it('retries a failed GET with growing delays until it succeeds', () => {
    setup();
    let result: unknown;
    http.get('api/tasks').subscribe((response) => (result = response));

    failWith(503);
    vi.advanceTimersByTime(299);
    httpTesting.expectNone('api/tasks');
    vi.advanceTimersByTime(1);
    failWith(503);

    vi.advanceTimersByTime(599);
    httpTesting.expectNone('api/tasks');
    vi.advanceTimersByTime(1);
    httpTesting.expectOne('api/tasks').flush({ ok: true });

    expect(result).toEqual({ ok: true });
  });

  it('gives up after the configured number of retries', () => {
    setup();
    let error: unknown;
    http.get('api/tasks').subscribe({ error: (e: unknown) => (error = e) });

    failWith(500);
    vi.advanceTimersByTime(300);
    failWith(500);
    vi.advanceTimersByTime(600);
    failWith(500);
    vi.advanceTimersByTime(1200);
    failWith(500);

    expect(error).toMatchObject({ status: 500 });
  });

  it('retries when the connection is lost', () => {
    setup();
    let result: unknown;
    http.get('api/tasks').subscribe((response) => (result = response));

    httpTesting.expectOne('api/tasks').error(new ProgressEvent('error'));
    vi.advanceTimersByTime(300);
    httpTesting.expectOne('api/tasks').flush([]);

    expect(result).toEqual([]);
  });

  it.each([404, 422])('does not retry client error %d', (status) => {
    setup();
    let error: unknown;
    http.get('api/tasks').subscribe({ error: (e: unknown) => (error = e) });

    failWith(status);
    vi.advanceTimersByTime(10_000);

    httpTesting.expectNone('api/tasks');
    expect(error).toMatchObject({ status });
  });

  it('never retries mutations', () => {
    setup();
    let error: unknown;
    http.post('api/tasks', {}).subscribe({ error: (e: unknown) => (error = e) });

    failWith(503);
    vi.advanceTimersByTime(10_000);

    httpTesting.expectNone('api/tasks');
    expect(error).toMatchObject({ status: 503 });
  });

  it('follows a custom retry policy', () => {
    setup({ maxRetries: 1, baseDelayMs: 50 });
    let error: unknown;
    http.get('api/tasks').subscribe({ error: (e: unknown) => (error = e) });

    failWith(503);
    vi.advanceTimersByTime(50);
    failWith(503);

    expect(error).toMatchObject({ status: 503 });
  });
});

describe('backoffDelay', () => {
  it('doubles the delay on every attempt', () => {
    expect([1, 2, 3, 4].map((attempt) => backoffDelay(attempt, 300))).toEqual([
      300, 600, 1200, 2400,
    ]);
  });
});
