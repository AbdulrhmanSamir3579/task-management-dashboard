# State and data

## NgRx SignalStore with `httpResource`

The brief asks for NgRx, signals, and `httpResource`. The options compared:

| Option                        | NgRx | Signals | `httpResource`      | Patterns |
| ----------------------------- | ---- | ------- | ------------------- | -------- |
| Classic NgRx (store, effects) | yes  | no      | no                  | 1        |
| Classic NgRx + `httpResource` | yes  | partly  | read-only data only | 2        |
| Hand-written signal services  | no   | yes     | yes                 | 1        |
| **NgRx SignalStore** (chosen) | yes  | yes     | yes, in the store   | 1        |

- `withEntities` keeps the tasks; `withComputed` derives columns, filters and statistics; `withMethods` is the only way to change state.
- `httpResource` (through `HttpBaseService.resource()`) loads data, and a store effect copies each successful load into the entities.
- **Reads use `httpResource`; writes use plain HTTP calls.** A resource is for reading: it refetches when its inputs change, which is wrong for a `POST`.

## One source of truth, and the store is the cache

Every page reads the same task list. The board columns, statistics, charts, calendar and team counts are `computed()` from it, so a change anywhere shows everywhere without another request.

An HTTP response cache (time-to-live, shared in-flight requests, invalidation) was built first and removed: the store already keeps the data, and two caches would disagree.

## Optimistic, race-free board changes

Moves, deletes and inline edits show at once and save in the background. Firing requests in parallel would let a slow, older response undo a newer move. So:

1. The change is applied locally, with the same ordering function the server uses.
2. Requests are queued and sent one at a time (`rxMethod` with `concatMap`), in the order the user made them.
3. A response only updates a card when no newer change for that card is waiting.
4. A failed change is rolled back, shown on the card (red flash) and in a toast; once the queue is empty, the board reloads from the server.
5. Data loaded while changes are waiting is discarded and loaded again afterwards.

Create and full edits from the dialog wait for the server instead: the dialog stays open with the input if saving fails.

## HTTP layer

`HttpBaseService` is the single entry point. Interceptors, outermost first: **error → language → retry → backend**.

- **Retry:** reads only, up to 3 times (300, 600, 1200 ms), for lost connections, 429 and 5xx. Writes are never retried, so a task is never created twice.
- **Language:** adds `Accept-Language`, so server messages come back in the user's language.
- **Error:** turns every failure into a typed `ApiError` with a readable message. Interceptors show no toasts; the caller decides between an error state with "Try again" and a toast.

## Mock backend: in-memory Web API, not JSON Server

It runs in the browser, so the GitHub Pages demo needs no server, and requests still pass through the real interceptors. It adds what a real backend owns: validation, ids and timestamps, column positions, an activity log, 400 ms latency, and a failure mode (`?chaos=0.3` fails 30% of requests). Seed dates move forward to today, so the demo never looks stale.

**Replacing it with a real API:** remove `provideMockApi()` from `app.config.ts` and provide `API_BASE_URL`. Responses go through the same mappers and interceptors.

## Next: real-time updates

Server-sent events or WebSocket messages would call the store's methods (`setEntity`, `removeEntity`). Every computed view updates by itself. Events for cards with changes still waiting would be reconciled by version, and a reconnect would reload.
