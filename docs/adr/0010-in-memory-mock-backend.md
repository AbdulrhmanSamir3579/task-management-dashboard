# 0010. In-memory mock backend

- Status: Accepted
- Date: 2026-10-21

## Context

The assignment asks for a mock backend with In-memory Web API or JSON Server, seeded from the generated `data-fetching/tasks.json`. The live demo should work on GitHub Pages, which cannot run a server.

## Decision

- `angular-in-memory-web-api`, running in the browser behind `HttpClient`, so interceptors run exactly as with a real server. Requests outside `api/` (translations, assets) still go to the network.
- `InMemoryDataService` adds what a real backend would own: the `TasksResponse` envelope from `DATA_README.md`, validation (422 for a blank title or unknown assignee), server-side ids and timestamps, column positions, an activity log written on every change, and read-only users and activities (405 on writes).
- The seed is generated once but the demo can be opened days later, so every date is moved forward by the days elapsed since generation. `isOverdue` is computed on the client instead of trusting the stored flag.
- `MockHttpBackend` extends the library backend to:
  - turn its plain error objects into real `HttpErrorResponse` instances;
  - add 400 ms latency, so loading states are visible;
  - fail a share of API requests with 503 when the URL has `?chaos=0.3`, to demonstrate retries and error states. The failure is decided per subscription, so each retry is a new attempt.
- The seed file loads as a separate lazy chunk.
- `provideMockApi()` must be listed after `provideApiHttpClient()` in `app.config.ts`, because it replaces the default backend.

## Consequences

- No server process is needed for development, tests or the GitHub Pages demo.
- Data resets on page reload.
- Moving to a real API means removing `provideMockApi()` and setting `API_BASE_URL`; no feature code changes.
