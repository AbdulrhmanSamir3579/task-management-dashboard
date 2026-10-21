# 0012. Global search with suggestions

- Status: Accepted
- Date: 2026-10-21

## Context

The header search should suggest matching tasks while the user types, showing the title, the description under it and the matched text highlighted. Typing produces a burst of input events, and responses can arrive out of order: without care, the app sends a request per keystroke and a slow response for an old query can replace the results of a newer one.

## Decision

- **Search runs on the server**: `GET /tasks?search=&limit=6` (title matches first). The header works even before the board has loaded, and the client never downloads the whole list just to search it.
- **One tested RxJS operator** (`taskSearch` in `features/tasks/task-search`) turns input into search states:
  - `map(trim)` → `debounceTime(300)` → `distinctUntilChanged()`: only queries that changed after a pause in typing are searched;
  - queries shorter than 2 characters do not search;
  - `switchMap` cancels the request for the previous query, so a stale response can never win;
  - `startWith` emits a `loading` state, and `catchError` turns a failure into an `error` state inside the inner stream, so the outer stream keeps working for the next query.
- The component subscribes with `takeUntilDestroyed()`.
- The operator is covered by marble tests with `TestScheduler` (virtual time), including a check that the cancelled request is unsubscribed before it answers.
- **Highlighting** uses a pure function and a `highlight` pipe that split the text into matched and unmatched parts; the template wraps matches in `<mark>`. No `innerHTML`, so task content can never inject markup, and regex characters in the query are escaped.
- **`ui-autocomplete`** wraps PrimeNG's AutoComplete with its own debounce turned off, a typed item template (`uiAutocompleteItem` with a context guard), and a `submitted` output for Enter without a chosen suggestion.
- Choosing a suggestion or pressing Enter opens the Tasks page filtered by the text (`/tasks?q=`).
- The search box is loaded with `@defer (on idle)` behind a placeholder that looks like the empty field: PrimeNG's AutoComplete would otherwise add about 30 kB (compressed) to the initial bundle.

## Consequences

- At most one search request is in flight, and only for the latest query.
- The search box becomes interactive a moment after first paint; the placeholder keeps the layout stable until then.
- Status messages ("Searching…", "No tasks found", "Search is unavailable…") come from the search state, not from extra flags.
