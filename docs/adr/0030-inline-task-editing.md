# 0030. Inline task editing

- Status: Accepted
- Date: 2026-10-23

## Context

The brief asks to "update existing task details inline or via modal". The task form in a dialog ([0016](0016-task-form.md)) covers every field, but small changes such as renaming a task or raising its priority should not need a dialog. The card is also a drag handle, so editing on it must not start a drag.

## Decision

- **Three fields on the card**, the ones changed most often; everything else stays in the task form:
  - **Title**: the ✏️ button or a double click on the title opens a text field. Enter saves, Escape cancels, and leaving the field saves. The button is always visible on touch screens and shows on hover or focus elsewhere.
  - **Priority**: the priority chip opens a menu with the other priorities.
  - **Assignee**: the avatar opens a menu with the other team members. Without loaded users it is plain text.
- **Same rules as the form**: the title is required, not only spaces, at most `TITLE_MAX_LENGTH` (100) characters and unique. The limits moved to `task-limits.ts`, so the board does not import the form. The unique check is synchronous here: the board only shows once every task is loaded, so `TasksStore.isTitleTaken()` answers from memory. An invalid title stays open with its message.
- **Optimistic and queued**: `TasksStore.edit()` changes the card at once and sends `PATCH /api/tasks/:id` through the same queue as moves and deletes ([0002](0002-race-free-optimistic-board-changes.md)). The card shows the usual saving, saved and failed states; a refused edit is undone and the store reloads. There is no success toast, like moves.
- **No drag while typing**: the title form stops `mousedown` and `touchstart`, so selecting text does not drag the card.
- **The card stays presentational**: it emits `quickEdit` with the changed fields; `TaskBoardSection` calls the store. `ui-menu` got `trigger="content"`, so any content (the chip, the avatar) can open a menu.
- **Accessible names say what happens and keep the visible text**, e.g. "High priority. Change priority of …". After Enter or Escape, focus goes back to the ✏️ button.

## Consequences

- Common changes take one or two clicks and no dialog, with mouse, touch or keyboard.
- Two places can change a title, so the rules live in shared validators and limits rather than in the form.
- Feedback is per card, so a failed edit is shown on the card and in an error toast, not in a dialog.
