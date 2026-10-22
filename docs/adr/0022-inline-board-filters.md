# 0022. Inline board filters

- Status: Accepted
- Date: 2026-10-22
- Amends: [0017](0017-board-filters.md)

## Context

[0017](0017-board-filters.md) put the priority and assignee filters in a side drawer opened by a "Filter" button. In review, the extra step (open the drawer, choose, close it) was judged slower than it needs to be for two controls, and it hid which filters were active behind a count.

## Decision

- **Dropdowns in the toolbar**: `TaskFilterBar` places a priority multi-select and an assignee select directly in the board toolbar, next to "+ New Task". Filters still apply as they change.
- The labels are visually hidden (each field keeps "Priority" and "Assignee" as its accessible name). The placeholders say what an empty choice means: "All priorities", "All assignees".
- The priority multi-select uses a new compact mode: one line with the chosen label, or "2 selected", instead of chips that would push the toolbar onto several lines.
- The assignee select can be cleared and searched. "Clear filters" in the "No tasks match" state still resets everything.
- The "Filter (N)" button, `countPanelFilters` and the `ui-drawer` wrapper were removed, as nothing else used them.
- Everything else in [0017](0017-board-filters.md) stands: status stays in the tabs, and the Tasks page keeps all filters in the URL.

## Consequences

- Active filters are visible at all times, and filtering takes one click fewer.
- On narrow screens the toolbar wraps, and the dropdowns move to their own line under the status tabs.
