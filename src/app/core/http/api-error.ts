import type { HttpErrorResponse } from '@angular/common/http';

export type ApiErrorKind =
  | 'network'
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'server'
  | 'unknown';

const KIND_BY_STATUS: Readonly<Record<number, ApiErrorKind>> = {
  0: 'network',
  400: 'validation',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  422: 'validation',
  429: 'rate_limited',
};

/** English fallback; the error interceptor shows these in the user's language. */
const DEFAULT_MESSAGES: Readonly<Record<ApiErrorKind, string>> = {
  network: 'Unable to reach the server. Check your connection and try again.',
  validation: 'Some of the information is invalid. Please review it and try again.',
  unauthorized: 'Your session has expired. Please sign in again.',
  forbidden: 'You do not have permission to do that.',
  not_found: 'The requested item could not be found.',
  conflict: 'This item was changed elsewhere. Refresh and try again.',
  rate_limited: 'Too many requests. Please wait a moment and try again.',
  server: 'Something went wrong on our side. Please try again.',
  unknown: 'Something went wrong. Please try again.',
};

const RETRYABLE_KINDS: ReadonlySet<ApiErrorKind> = new Set(['network', 'rate_limited', 'server']);

/** The error shape the app works with, independent of HttpClient. */
export class ApiError extends Error {
  override readonly name = 'ApiError';

  constructor(
    readonly kind: ApiErrorKind,
    message: string,
    readonly status: number,
    readonly url: string | null,
  ) {
    super(message);
  }

  /** Whether trying again later could succeed, e.g. to decide on showing a retry button. */
  get retryable(): boolean {
    return RETRYABLE_KINDS.has(this.kind);
  }
}

export function errorKindFor(status: number): ApiErrorKind {
  return KIND_BY_STATUS[status] ?? (status >= 500 ? 'server' : 'unknown');
}

/**
 * Converts an HTTP failure into an `ApiError` with a message safe to show users.
 * Server-provided messages are kept for client errors (4xx), where they explain what to
 * fix; network and server failures use generic messages instead of technical details.
 */
export function toApiError(
  error: HttpErrorResponse,
  defaultMessage: (kind: ApiErrorKind) => string = (kind) => DEFAULT_MESSAGES[kind],
): ApiError {
  const kind = errorKindFor(error.status);
  const isClientError = error.status >= 400 && error.status < 500;
  const message = (isClientError && messageFrom(error.error)) || defaultMessage(kind);
  return new ApiError(kind, message, error.status, error.url);
}

function messageFrom(body: unknown): string | undefined {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const { message } = body;
    return typeof message === 'string' && message.trim() ? message : undefined;
  }
  return undefined;
}
