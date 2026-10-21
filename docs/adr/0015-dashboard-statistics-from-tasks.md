# 0015. Dashboard statistics computed from tasks

- Status: Accepted
- Date: 2026-10-21

## Context

The design shows four statistic cards (Total Tasks, Completed, In Progress, Overdue), each with a change line such as "+12 this week". The provided `statistics.json` has that shape, but fixed numbers (156, 89, 42, 25) that do not match the 17 generated tasks, and it would not change when tasks are created, moved or deleted.

## Decision

- Compute the statistics in the browser from the tasks in `TasksStore` (`computeTaskStats` in `features/dashboard/data-access`), keeping the `Statistic` shape from `DATA_README.md`. The cards are a `computed()` signal, so they update the moment a card is moved or deleted.
- `statistics.json` is not used for values. Its icons, titles and colours are kept.
- Change lines, all derived from timestamps:

  | Card        | Value                      | Change                                             |
  | ----------- | -------------------------- | -------------------------------------------------- |
  | Total Tasks | all tasks                  | created in the last 7 days ("+N this week")        |
  | Completed   | status done                | completed today ("+N today")                       |
  | In Progress | status in progress         | due in the next 7 days ("N due this week")         |
  | Overdue     | open and past the due date | due yesterday, so overdue since today ("+N today") |

- The design's "Same as yesterday" for In Progress needs a history of past states that the data does not have, so it was replaced by "due this week".
- Green for good news, red for bad news, grey when nothing changed.

## Consequences

- The cards never disagree with the board, and need no extra request.
- Overdue is computed from today's date, not from the stored `isOverdue` flag, which goes stale.
- With a real backend that keeps history, the change lines could come from the server instead.
