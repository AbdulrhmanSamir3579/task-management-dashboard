import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';
import { retry, throwError, timer } from 'rxjs';

export interface RetryConfig {
  /** Retries after the first failure; 3 means up to 4 attempts in total. */
  maxRetries: number;
  /** Wait before the first retry; doubles on every following retry. */
  baseDelayMs: number;
}

export const RETRY_CONFIG = new InjectionToken<RetryConfig>('RETRY_CONFIG', {
  providedIn: 'root',
  factory: () => ({ maxRetries: 3, baseDelayMs: 300 }),
});

/** Methods that are safe to repeat: sending them twice cannot change data twice. */
const IDEMPOTENT_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Failures that may succeed on a second try: lost connection, throttling, server errors. */
export function isTransientFailure(error: unknown): boolean {
  return (
    error instanceof HttpErrorResponse &&
    (error.status === 0 || error.status === 429 || error.status >= 500)
  );
}

/** Exponential backoff: 300, 600, 1200 ms... for attempts 1, 2, 3 with a 300 ms base. */
export function backoffDelay(attempt: number, baseDelayMs: number): number {
  return baseDelayMs * 2 ** (attempt - 1);
}

/**
 * Retries transient failures of idempotent requests. Mutations are never retried,
 * since repeating a POST could create the same task twice.
 */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (!IDEMPOTENT_METHODS.has(req.method)) {
    return next(req);
  }

  const { maxRetries, baseDelayMs } = inject(RETRY_CONFIG);
  return next(req).pipe(
    retry({
      count: maxRetries,
      delay: (error: unknown, attempt) =>
        isTransientFailure(error)
          ? timer(backoffDelay(attempt, baseDelayMs))
          : throwError(() => error),
    }),
  );
};
