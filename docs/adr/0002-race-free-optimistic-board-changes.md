# 0002. Race-free optimistic board changes

- Status: Accepted
- Date: 2026-10-21

## Context

Dragging a card or deleting it must feel instant, so the board updates before the server answers. Optimistic updates have well-known races:

- two quick moves can reach the server, or come back, in the wrong order;
- an older response can overwrite a newer move of the same card;
- restoring a full snapshot after a failure undoes other changes made in the meantime;
- a reload that started before a change can land after it and bring old data back.

The user also needs to see what is happening: a card that is saving should look busy, and success or failure should be visible.

## Decision

Board changes (move, delete) in `TasksStore`:

1. Apply the change locally at once, using the same ordering function as the server (`moveOnBoard`, `removeFromBoard` in `shared/utils/board-order.ts`).
2. Queue the request. An `rxMethod` with `concatMap` sends one request at a time, in the order the user made the changes.
3. Count waiting changes per card. A response or a rollback only touches a card when it belongs to the newest change for that card.
4. On failure, put the card back where this change found it, show an error toast, and mark the board for a reload. When the queue is empty, reload from the server, which is the source of truth.
5. Ignore data loaded while changes are waiting, and load again once they are done.
6. Expose `changeStates` per card: `saving` while waiting (shown muted), then `saved` or `failed` for `TASK_FEEDBACK_MS` (1.5 s) as a short flash.
7. Ignore a drop in the same place, so no request is sent.

## Consequences

- The board never ends in a state the server does not have, even when requests fail or overlap.
- Changes to different cards wait for each other. Each request is small, so the delay is not noticeable.
- After a failure there is one extra `GET /tasks`.
- Create and update are not queued: they are not optimistic and do not reorder the board.
