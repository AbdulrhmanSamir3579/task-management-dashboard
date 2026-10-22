# Architecture decision records

Short records of the decisions that shape this codebase: what was decided, why, and what it costs. A new record is added in the same pull request as the change it describes.

| #                                                       | Decision                                    | Status                    |
| ------------------------------------------------------- | ------------------------------------------- | ------------------------- |
| [0001](0001-state-management-with-ngrx-signal-store.md) | State management with NgRx SignalStore      | Accepted                  |
| [0002](0002-race-free-optimistic-board-changes.md)      | Race-free optimistic board changes          | Accepted                  |
| [0003](0003-angular-22-standalone-zoneless.md)          | Angular 22, standalone, zoneless and strict | Accepted                  |
| [0004](0004-code-quality-and-delivery-workflow.md)      | Code quality and delivery workflow          | Accepted                  |
| [0005](0005-testing-strategy.md)                        | Testing strategy                            | Accepted                  |
| [0006](0006-ui-library-behind-wrapper-components.md)    | UI library behind wrapper components        | Accepted                  |
| [0007](0007-theming-from-design-tokens.md)              | Theming from design tokens                  | Accepted                  |
| [0008](0008-single-http-entry-point.md)                 | Single HTTP entry point                     | Accepted                  |
| [0009](0009-http-interceptors.md)                       | HTTP interceptors                           | Accepted                  |
| [0010](0010-in-memory-mock-backend.md)                  | In-memory mock backend                      | Accepted                  |
| [0011](0011-lazy-loading-and-bundle-budget.md)          | Lazy loading and bundle budget              | Accepted, amended by 0018 |
| [0012](0012-global-search-with-suggestions.md)          | Global search with suggestions              | Accepted, amended by 0014 |
| [0013](0013-task-board-interactions.md)                 | Task board interactions                     | Accepted                  |
| [0014](0014-local-first-search.md)                      | Local-first search                          | Accepted, amended by 0017 |
| [0015](0015-dashboard-statistics-from-tasks.md)         | Dashboard statistics computed from tasks    | Accepted                  |
| [0016](0016-task-form.md)                               | Task form                                   | Accepted                  |
| [0017](0017-board-filters.md)                           | Board filters                               | Accepted, amended by 0022 |
| [0018](0018-chart-layer.md)                             | Chart layer                                 | Accepted                  |
| [0019](0019-activity-feed.md)                           | Activity feed                               | Accepted                  |
| [0020](0020-team-page.md)                               | Team page                                   | Accepted                  |
| [0021](0021-calendar-agenda.md)                         | Calendar as an agenda                       | Accepted                  |
| [0022](0022-inline-board-filters.md)                    | Inline board filters                        | Accepted                  |

## Template

```md
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context

What problem or constraint led to this decision.

## Decision

What we do.

## Consequences

What gets easier, what gets harder, and what to watch.
```
