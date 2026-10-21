# 0014. Local-first search

- Status: Accepted
- Date: 2026-10-21
- Amends: [0012](0012-global-search-with-suggestions.md)

## Context

[0012](0012-global-search-with-suggestions.md) sent every search to the server. Once the board has loaded every task, a request per query only adds latency (debounce plus network) for data the browser already has. On the Tasks page, users also expect the board itself to narrow down while they type, not only after pressing Enter.

## Decision

- **Suggestions come from the loaded tasks when there are any**: the header search reads `TasksStore`; when it has loaded, matches are computed in the browser at once, with no request and no debounce. Before the first load completes, or when it failed, the debounced API search from 0012 is used, with `switchMap` cancelling stale requests.
- The delay is read for every query (`debounceMs` accepts a function), so one pipeline switches between both sources without being rebuilt.
- **Same ranking everywhere**: `rankByText` in `shared/utils/text-search.ts` (title matches first) is used by both the mock API and the browser, so results look the same whichever source answers.
- **Live filtering on the Tasks page**: every keystroke sets the store's search filter. `?q=` follows in the address bar with `replaceUrl`, debounced by 300 ms, so the URL stays shareable without adding a history entry per letter.
- **Two-way with the page**: when the search is cleared on the page (search chip, Clear filters), the header box is cleared too.
- The search box lives in the shell, so it creates the tasks store and the tasks load right after first paint on any page. This keeps local search available almost always; the dashboard needs the same data anyway.
- The store's own debounced `search` method was removed as unused.

## Consequences

- After the first load, search and filtering are instant and work without network.
- Local results reflect the client's copy of the data; changes made elsewhere appear after the next reload, like the rest of the board.
- One extra `GET /tasks` happens at start-up on pages that do not show tasks.
