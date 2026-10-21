# 0008. Single HTTP entry point

- Status: Accepted
- Date: 2026-10-21

## Context

Calling `HttpClient` from many services spreads base URLs, query parameter handling and request options across the codebase. The same team practice exists in other projects of ours as `HttpBaseService`.

## Decision

- `HttpBaseService` in `src/app/core/http` is the only class that uses `HttpClient` and `httpResource`. ESLint blocks both everywhere else, except in tests.
- It offers `get`, `post`, `put`, `patch`, `delete`, `deleteWithBody` (Observables) and `resource()` (a signal-based GET built on `httpResource`), all taking the same options: `params`, `headers`, `context`.
- Endpoints are relative to `API_BASE_URL` (default `api`, relative so it works under any `<base href>`). Absolute URLs pass through.
- Query parameters skip empty values, repeat keys for arrays (`?status=todo&status=done`) and keep brackets readable in keys such as `filter[q]`.
- The service does not handle errors; that is the error interceptor's job (see [0009](0009-http-interceptors.md)).

## Consequences

- Pointing the app at a real backend means changing `API_BASE_URL` only.
- Feature services stay tiny and typed (`TasksApi`), and tests mock one layer.
