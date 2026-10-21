# 0005. Testing strategy

- Status: Accepted
- Date: 2026-10-21

## Context

The assignment requires at least 80% coverage, component tests with "whatever you think is the best testing tool" and service tests with proper mocking. Tests should survive refactors and catch real behaviour, not implementation details.

## Decision

- **Vitest** through Angular's own `@angular/build:unit-test` builder (the Angular default), with jsdom.
- **Angular Testing Library** with `user-event` and `jest-dom` matchers: components are tested the way a user uses them, by role, label and text.
- **`HttpTestingController`** for services and stores. HTTP-level flows (retries, errors, the mock API) are also tested end to end through the real interceptors and the in-memory backend.
- **Coverage** with the v8 provider over every file in `src/app`, so a file without tests counts against the total instead of disappearing from the report. Thresholds of 80% for statements, branches, functions and lines fail `npm run test:ci` and CI. Specs, `app.config.ts` and route files are excluded.
- **Time**: tests fake only the date (`vi.useFakeTimers({ toFake: ['Date'] })`) instead of injecting a clock.
- `src/test-setup.ts` loads the jest-dom matchers and stubs `matchMedia`, which jsdom lacks and PrimeNG overlays need.
- Regression tests are checked against the broken code once, to confirm they fail without the fix.

## Consequences

- Tests read like usage and double as basic accessibility checks: an element that cannot be found by role and name is also hard to use with a screen reader.
- PrimeNG overlays render under `<body>`, so tests query the whole document.
- Rendering in jsdom does not apply media queries; responsive CSS is written mobile first where tests need the element to be visible.
