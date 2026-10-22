import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { catchError, throwError } from 'rxjs';
import { type ApiErrorKind, toApiError } from './api-error';

const messageKey = (kind: ApiErrorKind): string => `ERRORS.${kind.toUpperCase()}`;

/**
 * Outermost interceptor: callers never see `HttpErrorResponse`, only `ApiError`, with a
 * message in the user's language. It runs after retries, so it only sees failures that
 * are final. Showing the error is left to the caller, which knows the context
 * (inline error state for reads, a toast for failed actions).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const translate = inject(TranslateService);
  return next(req).pipe(
    catchError((error: unknown) =>
      throwError(() =>
        error instanceof HttpErrorResponse
          ? toApiError(error, (kind) => translate.instant(messageKey(kind)) as string)
          : error,
      ),
    ),
  );
};
