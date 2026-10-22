# 0019. Activity feed

- Status: Accepted
- Date: 2026-10-22

## Context

The assignment asks for a recent activity feed showing changes to tasks. The design has no feed on the Dashboard, but it has a 🔔 in the header. The mock API already records an entry for every create, edit, status change and delete ([0010](0010-in-memory-mock-backend.md)).

## Decision

- **The feed lives behind the 🔔**: a popover anchored to the button lists the 20 newest entries ("Sarah Smith moved Prepare budget to Done · 5 minutes ago"). The button shows how many are unread, capped at "9+", and its accessible name says the full number.
- `GET /api/activities?limit=` returns the newest entries first, so the client never downloads the whole log.
- **`ActivityStore`** (NgRx SignalStore with `httpResource`, like the other stores):
  - "Seen" is the time of the newest entry when the panel was last opened. It is kept in `localStorage` through `BrowserStorage`, which also works when storage is blocked or full (the count then resets on reload).
  - Your own changes never count as unread.
  - Opening the panel marks everything as seen, and closing it marks entries that arrived while it was open. Entries that were new when it opened stay highlighted until it closes.
- **Refreshing**: `TasksStore` counts the changes the server accepted (`savedChanges`), and `ActivityStore` loads the feed again when that count goes up. The tasks store does not know the feed exists; the dependency points from the feed to the tasks. Opening the panel also reloads it, to pick up changes made elsewhere.
- **Relative times** come from `Intl.RelativeTimeFormat` ("yesterday", "3 weeks ago") through a pure `relativeTime` pipe. The panel passes the current time when it opens, so the pipe stays pure. The full date is in the `title`, from `Intl.DateTimeFormat`. `DatePipe` was avoided: `@angular/common` sits in a chunk loaded at start-up, and using it from a lazy chunk added about 10 kB there.
- **Popover wrapper** `ui-popover` (PrimeNG Popover, a labelled dialog): Escape and a click outside close it, and focus goes back to the button when it was inside the panel. The list is focusable so it can be scrolled from the keyboard.
- The bell loads with `@defer (on idle)` like the search box, with a static 🔔 placeholder, so the initial bundle grows by less than 1 kB.

## Consequences

- The badge only changes when the feed reloads: after your own changes or when the panel opens. Changes made by other people in a real multi-user backend would need polling or server push to show up sooner.
- "Seen" is per browser, not per account.
