import { HttpErrorResponse, type HttpResponse } from '@angular/common/http';
import { HttpClientBackendService, type ResponseOptions } from 'angular-in-memory-web-api';
import { type Observable, catchError, throwError } from 'rxjs';

/**
 * angular-in-memory-web-api emits plain objects for error responses. This backend turns
 * them into real `HttpErrorResponse` instances, so interceptors and `httpResource` see
 * exactly what they would get from a real server.
 */
export class MockHttpBackend extends HttpClientBackendService {
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
}
