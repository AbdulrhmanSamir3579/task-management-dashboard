import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { toApiError } from './api-error';

/**
 * Outermost interceptor: callers never see `HttpErrorResponse`, only `ApiError`.
 * It runs after retries, so it only sees failures that are final.
 * Showing the error is left to the caller, which knows the context
 * (inline error state for reads, a toast for failed actions).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: unknown) =>
      throwError(() => (error instanceof HttpErrorResponse ? toApiError(error) : error)),
    ),
  );
