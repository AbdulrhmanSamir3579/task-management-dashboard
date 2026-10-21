# 0013. Task board interactions

- Status: Accepted
- Date: 2026-10-21

## Context

The board from the design shows three columns of cards that can be dragged within and between columns. Cards can also be hidden by the status tabs or a search, and the store applies board changes optimistically through a queue (see [0002](0002-race-free-optimistic-board-changes.md)). Dragging must stay correct with hidden cards, be usable without a mouse, and make the state of each change visible.

## Decision

- **Split by role**: `TaskCard`, `TaskBoard` and `BoardToolbar` are presentational (inputs and outputs only); `TaskBoardSection` connects them to `TasksStore` and is shared by the Dashboard and Tasks pages.
- **Drops are relative**: the board reports `{ taskId, status, beforeTaskId }` instead of an index. A filtered column only shows some cards, so the index from the drag-and-drop library would point to the wrong place; `TasksStore.drop()` finds `beforeTaskId` in the full column and works out the position there. A drop in the same place is ignored.
- **Drag and drop with the Angular CDK** (`cdkDropListGroup`, `cdkDropList`, `cdkDrag`), with a dashed placeholder where the card will land. Columns keep a minimum height, so an empty column is still a drop target.
- **Keyboard alternative**: drag and drop is pointer-only, so every card's menu offers "Move to …" for the other columns (placed at the end of that column) and Delete.
- **Visible state per card**, from `changeStates` in the store: muted with `aria-busy` while saving, a green ring on success, a red ring and a short shake on failure (the card is back in its place by then). With reduced motion, the flash becomes a static outline. A card cannot be dragged again while its change is saving.
- **Delete asks first** through `ConfirmService`, with focus on Cancel.
- **Status tabs** set the status filter; with a status selected, only that column is shown.
- **Search from the header** arrives as `/tasks?q=`, bound to the page input by the router, and shows as a chip that clears it.
- **States**: a skeleton board while loading, an error state with "Try again", and "No tasks match your filters" with "Clear filters".

## Consequences

- Positions stay correct whatever is filtered, because the server and the store both order the full column with the same function.
- Moving a card is possible with mouse, touch and keyboard.
- Filters live in the root store, so a search started on the Tasks page still applies on the Dashboard until it is cleared.
