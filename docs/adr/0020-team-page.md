# 0020. Team page

- Status: Accepted
- Date: 2026-10-22

## Context

The assignment asks for "a simple user list to assign tasks (can be mocked data)". The sidebar has a Team item. The mock API serves the users derived from the task assignees ([0010](0010-in-memory-mock-backend.md)); there is no endpoint to add or edit people.

## Decision

- **Read-only list**: the Team page shows the people from `UsersStore`, one card each. Adding or editing people is out of scope, since the brief allows mocked users.
- **Workload computed in the browser**: `summarizeTeam` counts each person's open, in progress, done and overdue tasks from `TasksStore`, and the share that is done. As with the dashboard statistics ([0015](0015-dashboard-statistics-from-tasks.md)), the cards follow every change on the board without another request. People without tasks are listed too.
- **From a person to their tasks**: "View tasks" links to `/tasks?assignee=<id>`, reusing the URL filters from [0017](0017-board-filters.md), so the board opens filtered to that person.
- **Assigning from the team**: "Assign task" calls `TaskEditorStore.openCreate({ assigneeId })`. The task form takes it as `defaultAssigneeId` and fills it in before marking the form pristine, so closing the dialog without other changes does not ask to discard. The store clears it when the dialog closes or opens for editing.
- **States**: skeleton cards until both people and tasks have loaded; an error with a retry that reloads only what failed; a message when there is nobody.
- **Accessibility**: each card is an `article` named by the person's heading. Counts are a description list, and progress is a `progressbar` with a name. "View tasks" and "Assign task" have names that start with their visible text and add the person ("Assign task to Sarah Smith").
- The grid uses `auto-fill` with a minimum card width, so it adapts from one to several columns without media queries.

## Consequences

- Real user management (invites, roles, deactivation) would need endpoints and a form; the cards and the summary function would stay.
- Counts reflect the tasks loaded in the browser, the same source as the board and the charts.
