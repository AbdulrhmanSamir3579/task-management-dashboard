# 0001. State management with NgRx SignalStore

- Status: Accepted
- Date: 2026-10-21

## Context

The assignment asks for three things that pull in different directions: NgRx (for caching, alongside interceptors), Signals "for reactive state management where appropriate", and the new `httpResource` "to handle the API requests".

Options considered:

| Option                                  | NgRx | Signals | `httpResource`        | Patterns |
| --------------------------------------- | ---- | ------- | --------------------- | -------- |
| Classic NgRx (store, effects)           | yes  | no      | no                    | 1        |
| Classic NgRx for tasks + `httpResource` | yes  | partly  | read-only data only   | 2        |
| Hand-written signal services            | no   | yes     | yes                   | 1        |
| **NgRx SignalStore**                    | yes  | yes     | yes, inside the store | 1        |

## Decision

Use `@ngrx/signals` SignalStore for feature state.

- `withEntities` keeps the loaded tasks; the entity state is the client-side cache, so pages share data without fetching again. An HTTP-level response cache was removed for this reason.
- `httpResource` (through `HttpBaseService.resource()`) loads data inside the store. A store effect copies every successful load into the entity state.
- Changes go through store methods that call `HttpBaseService`. Create and update wait for the server; move and delete are optimistic (see [0002](0002-race-free-optimistic-board-changes.md)).
- `rxMethod` is used where RxJS operators matter, for example the board change queue (`concatMap`).
- Components read signals from the store and call its methods; they never call the API.

## Consequences

- One pattern covers all three requirements, with little boilerplate compared to actions, reducers and effects.
- Store members starting with `_` are private by SignalStore convention, which keeps the public API small.
- Stores are root-provided, so data survives navigation. Fresh data needs an explicit `reload()`.
- Tests drive the store through `HttpTestingController`, the same way the app uses it.
