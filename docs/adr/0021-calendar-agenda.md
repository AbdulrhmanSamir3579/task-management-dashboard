# 0021. Calendar as an agenda

- Status: Accepted, amended by [0023](0023-calendar-views.md) (Month and Week views added)
- Date: 2026-10-22

## Context

The sidebar has a Calendar item, but the assignment does not ask for a calendar, and the design has no calendar screen. With every task having a due date, the useful question the page can answer is "what is due, and when?". The extra pages were agreed to stay lightweight.

## Decision

- **An agenda, not a month grid**: open tasks grouped into Overdue, Today, Next 7 days and Later (`buildAgenda`). Done tasks are left out, and so are empty groups. Each group is ordered by due date, then priority (high first), then title.
- A month grid was not built: with a handful of tasks it would be mostly empty cells, and it is harder to make work on phones and with screen readers than a list.
- Each entry shows the day (weekday, date, month, with the full date as a tooltip), the title, the same due text as the board cards ("Overdue by 2 days", from `describeDueDate`), the status, a priority tag and the assignee.
- Choosing a title opens the task in the shared edit dialog (`TaskEditorStore.openEdit`).
- Data comes from `TasksStore`, computed in the browser like the other pages, so moving or editing a task anywhere updates the agenda. "Today" is recomputed together with the tasks.
- **States**: placeholders while loading, a retry on error, and "Nothing due" with a New Task button when every task is done.
- Each group is a region named by its heading, which includes its count.

## Consequences

- A real calendar view (month or week) could be added later on top of the same grouping data.
- A page left open past midnight moves tasks between groups the next time any task changes, not at midnight exactly.
