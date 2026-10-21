import {
  type HttpEvent,
  HttpErrorResponse,
  type HttpRequest,
  type HttpResponse,
} from '@angular/common/http';
import type { XhrFactory } from '@angular/common';
import {
  HttpClientBackendService,
  type InMemoryBackendConfigArgs,
  type InMemoryDbService,
  type ResponseOptions,
  STATUS,
} from 'angular-in-memory-web-api';
import { type Observable, catchError, switchMap, throwError, timer } from 'rxjs';

export interface FailureSimulation {
  /** Share of API requests that fail, from 0 (never) to 1 (always). */
  rate: number;
  /** Source of randomness; replaced in tests to make failures deterministic. */
  random: () => number;
}

/**
 * In-memory backend with two additions:
 * - error responses become real `HttpErrorResponse` instances (the library emits plain
 *   objects), so interceptors and `httpResource` behave exactly as with a real server;
 * - a configurable share of API requests fails with 503, to exercise retry and error UI.
 */
export class MockHttpBackend extends HttpClientBackendService {
  constructor(
    inMemDbService: InMemoryDbService,
    config: InMemoryBackendConfigArgs,
    xhrFactory: XhrFactory,
    private readonly failure: FailureSimulation,
  ) {
    super(inMemDbService, config, xhrFactory);
  }

  override handle(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    if (this.isApiRequest(req) && this.failure.random() < this.failure.rate) {
      return this.simulateFailure(req);
    }
    return super.handle(req);
  }

  protected override createResponse$fromResponseOptions$(
    resOptions$: Observable<ResponseOptions>,
  ): Observable<HttpResponse<unknown>> {
    return super.createResponse$fromResponseOptions$(resOptions$).pipe(
      catchError((options: ResponseOptions) =>
        throwError(
          () =>
            new HttpErrorResponse({
              error: options.body,
              headers: options.headers,
              status: options.status,
              statusText: options.statusText,
              url: options.url,
            }),
        ),
      ),
    );
  }

  private isApiRequest(req: HttpRequest<unknown>): boolean {
    return req.url.startsWith(this.config.apiBase ?? 'api/');
  }

  private simulateFailure(req: HttpRequest<unknown>): Observable<never> {
    return timer(this.config.delay ?? 0).pipe(
      switchMap(() =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: STATUS.SERVICE_UNAVAILABLE,
              statusText: 'Service Unavailable',
              url: req.urlWithParams,
              error: { message: 'Simulated server failure. Please try again.' },
            }),
        ),
      ),
    );
  }
}
