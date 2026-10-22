# 0023. Calendar views

- Status: Accepted
- Date: 2026-10-22
- Amends: [0021](0021-calendar-agenda.md)

## Context

[0021](0021-calendar-agenda.md) built the Calendar page as an agenda only. In review, the page was expected to be a calendar: Month and Week views, with the agenda as a third view.

## Decision

- **Three views**: Month (default), Week and Agenda, switched from a toolbar with previous, Today and next buttons and the period title ("October 2026", "Oct 19 – 25, 2026"). The agenda from 0021 is unchanged.
- **State in the URL**: `?view=week&date=2026-10-22`, read through component input binding like the Tasks page filters. Defaults (month, today) are left out of the URL. Unknown views and invalid dates fall back to the defaults. View and period changes add history entries, so the back button steps back through them.
- **Pure grid functions** (`calendar-grid.ts`): `monthGrid` (the whole weeks covering the month), `weekDays`, `shiftDate`, `periodLabel` and `weekdayLabels`. Weeks start on Monday (ISO 8601, `WEEK_STARTS_ON`). Each day lists the tasks due that day: open ones first by priority, then done ones.
- **Month view** is a real `table` with weekday column headers, so screen readers announce rows and columns without extra ARIA. A cell shows up to three task chips (coloured by priority, done ones struck through), then "+N more", which opens that day's week. On phones the chips do not fit, so a cell shows a count that opens the week instead.
- **Week view** shows seven day columns (stacked on narrow screens), each task with its priority tag and assignee.
- **Adding from a day**: days from today on have a "+" that opens the new task form with that due date (`openCreate({ dueDate })`, `defaultDueDate` on the form). Past days have none, since a new task cannot be due in the past.
- Choosing a task in any view opens it in the shared edit dialog. Everything is computed from `TasksStore`, so the calendar follows board changes.
- Dates are formatted with `Intl.DateTimeFormat` (including `formatRange` for weeks), not `DatePipe`, for the bundle reason in [0019](0019-activity-feed.md).
- A calendar library was not added: the views needed are small, they reuse the app's components and tokens, and the pure functions are easy to test.

## Consequences

- Day and year views, drag and drop between days, or a locale-dependent first day of the week could be added on the same grid functions.
- Like the agenda, the grid moves to a new "today" when tasks change, not exactly at midnight.
