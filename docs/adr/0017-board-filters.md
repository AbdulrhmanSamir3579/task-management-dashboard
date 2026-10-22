# 0017. Board filters

- Status: Accepted
- Date: 2026-10-22
- Amends: [0014](0014-local-first-search.md)

## Context

The assignment asks for filtering by status, priority and assignee, plus search. The status tabs and the header search already existed; priority and assignee had no UI. The design shows a "Filter" button next to "New Task" in the board toolbar. A filtered view should also survive a reload and be shareable, which means keeping it in the URL.

## Decision

- **A side drawer, not a popover**: the "Filter" button opens `ui-drawer` (a wrapper around PrimeNG's drawer) with a priority multi-select and an assignee select. The selects open their own overlays; inside a popover, a click in those overlays would count as a click outside and close it. The drawer is announced as a modal dialog named by its heading and keeps focus inside.
- **Filters apply as they change**, with no "Apply" step: the board is local data, so filtering is instant. "Clear" resets priority and assignee; "Done" closes the drawer.
- **Status stays in the tabs**, not in the drawer, so there is one place to choose it.
- **The button shows the count**: "Filter (3)" counts chosen priorities plus the assignee (`countPanelFilters`), so active filters are visible while the drawer is closed.
- `TaskFilterPanel` is presentational: it gets the current filters and the assignee options and emits each change. The filters are written into its form with `emitEvent: false`, so a change from outside (Clear, the URL) is shown without being sent back.
- **The Tasks page owns the URL**: `?q=&status=&priority=&assignee=` (lists comma-separated). `filtersToParams` and `filtersFromParams` convert both ways; unknown or empty values mean "no filter", so a hand-edited URL cannot break the board.
  - A URL change from outside (a link, the header search, the sidebar) replaces the filters.
  - Filter changes on the page are written back with `replaceUrl`, debounced by 300 ms, so typing a search does not add history entries.
  - The page remembers the params it wrote last. When the router hands them back, they are ignored, so text typed while the navigation was in flight is not undone.
- This replaces the `?q=` syncing in the header search box from [0014](0014-local-first-search.md): with several filters in the URL, one writer avoids two components racing to update it. On the Tasks page, Enter in the search box now keeps the other filters.

## Consequences

- Every filtered view has a URL that can be bookmarked or shared.
- Opening the Tasks page from the sidebar shows the board unfiltered, even if filters were set on the Dashboard, which shares the same store. The URL decides.
- The Dashboard board can be filtered too, but those filters are not kept in its URL.
