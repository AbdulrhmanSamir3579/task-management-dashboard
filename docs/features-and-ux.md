# Features and UX

## Board: drag and drop with the Angular CDK

- Drops are reported as "before which card", not as an index. A filtered column shows only some cards, so an index would point to the wrong place; the store finds the position in the full column.
- **Keyboard alternative:** every card's menu has "Move to …" and Delete.
- **Feedback per card:** muted while saving, a green flash when saved, a red flash and shake when it fails (a static outline with reduced motion).
- Delete asks first, with focus on Cancel.

## Inline editing on the card

The title (✏️ or a double click), the priority chip and the assignee can be changed without the dialog. Enter saves, Escape cancels, leaving the field saves. The title follows the form's rules (required, not only spaces, 100 characters, unique), and changes go through the same optimistic queue as moves.

## Task form: typed Reactive Forms

- `NonNullableFormBuilder`, custom validators that carry their own message: not blank, unique title (async, local first), due date not in the past, completion date not in the future, list limits.
- **Dynamic controls:** "Completed on" is added only for done tasks; the checklist is a `FormArray`.
- Errors show once a field is touched; submit focuses the first invalid field; closing with changes asks "Discard changes?".

**Next:** Signal Forms, once the team adopts them. The validators and limits are already plain functions and constants, which keeps that move small.

## Search: local first, debounced with Angular's `debounced()`

- Once the tasks are loaded, suggestions come from them at once: no request, no wait.
- Before that, the API is searched through an `httpResource`, which cancels the request for an outdated query.
- The API search waits for a 300 ms pause in typing, using Angular 22's `debounced()`. **Enter ends the wait at once**, through a small helper (`submittableWait`) that matches the submitted text whether the wait has started or not.
- On the Tasks page every keystroke filters the board; `?q=` follows in the URL.

**Why `debounced()` over RxJS `debounceTime`:** the whole search is now signals (query → debounced query → `httpResource` → suggestions), with no subscriptions to manage. `debounced()` is still experimental in Angular 22; the helper keeps the wait logic in one tested place if its API changes.

## Filters live in the URL

Status tabs, priority and assignee filters and the search are kept in the query string, so a filtered board can be shared or bookmarked.

## Calendar without a library

Month (a real `table`), week and agenda views, with the view and date in the URL. Weeks start on Monday. Pure functions build the grids, and everything is computed from the store, so the calendar follows board changes. A calendar library would have been heavier than the small views needed.

## Accessibility

- Landmarks, headings, a skip link, visible focus, and accessible names on every icon button.
- Keyboard alternatives for drag and drop; focus returns after inline edits.
- Text colours chosen for 4.5:1 contrast in both themes; charts have hidden data tables; one global rule honours reduced motion.
- axe-core runs in the unit tests for every page and dialog.

## Dark mode

Light, Dark or System (follows the device, live). A small inline script applies a saved dark theme before Angular starts, so a reload never flashes white.
