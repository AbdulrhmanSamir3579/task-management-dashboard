# 0009. HTTP interceptors

- Status: Accepted
- Date: 2026-10-21

## Context

The assignment asks for proper HTTP error handling, retry logic and caching through HTTP interceptors or NgRx. Components should never deal with raw `HttpErrorResponse` objects or status codes.

## Decision

Interceptors, in this order: **error → retry → backend**.

- **Retry** (closest to the network): retries `GET`, `HEAD` and `OPTIONS` up to 3 times with exponential backoff (300, 600, 1200 ms), only for failures that may recover: lost connection (status 0), throttling (429) and server errors (5xx). Mutations are never retried, since repeating a `POST` could create the same task twice.
- **Error** (outermost): turns every `HttpErrorResponse` into a typed `ApiError` (`network`, `validation`, `not_found`, `server`, ...) with a `retryable` flag. Server messages are kept for 4xx, where they explain what to fix; network and server failures use generic messages instead of technical details. It runs after retries, so it only sees final failures.
- The interceptors do not show toasts. The caller knows the context: an inline error state with a retry button for a failed load, a toast for a failed action. A global toast would show the same error twice.
- **No HTTP response cache.** A cache interceptor (time-to-live, shared in-flight requests, invalidation after changes) was built first and then removed: loaded data is kept in the NgRx stores instead (see [0001](0001-state-management-with-ngrx-signal-store.md)), and two caches would disagree.

## Consequences

- Callers handle one error type with a readable message.
- Reads recover from short outages without the user noticing; writes fail fast and are reported.
- Fresh data comes from an explicit store reload, not from cache expiry.
