# Architecture

## Angular 22, standalone, zoneless, strict

- Standalone components only, zoneless change detection, and OnPush on every component.
- Modern APIs throughout: `inject()`, `input()`, `output()`, `model()`, signals, `@if` / `@for` / `@defer`.
- Strict TypeScript (`strict`, `noUncheckedIndexedAccess`) and strict templates.

**Why:** Angular 22 was current when the project started, and every library needed (PrimeNG, NgRx, ngx-echarts, angular-in-memory-web-api) supported it natively. Zoneless with signals means change detection runs only where a signal changed.

## Feature-first folders

```text
core/       App-wide services, loaded once: HTTP, mock API, i18n, layout, theme, storage
shared/     Reusable building blocks with no business logic: UI wrappers, charts, utils
features/   One lazy folder per page: dashboard, tasks, calendar, analytics, team, settings
```

Inside a feature, `data-access/` holds the store and API, `components/` holds presentational components, and a section component connects them.

## Three boundaries, enforced by ESLint

| Library                      | Allowed only in | Everyone else uses                          |
| ---------------------------- | --------------- | ------------------------------------------- |
| `HttpClient`, `httpResource` | `core/http`     | `HttpBaseService`                           |
| PrimeNG                      | `shared/ui`     | `ui-*` components with our own types        |
| ECharts                      | `shared/charts` | chart services and the `ui-chart` component |

**Why:** a library upgrade or swap touches one folder. PrimeNG has a history of breaking changes between majors; behind wrappers they stay contained. Gaps in a library (a missing label, focus handling) are fixed once, in the wrapper.

**Trade-off:** every new PrimeNG component needs a wrapper first. That is a few minutes of work, and it keeps feature code free of library types.

## Smart and presentational components

- **Presentational** (`TaskBoard`, `TaskCard`, `TaskFilterBar`, `TaskForm`): inputs and outputs only, easy to test.
- **Smart** (`TaskBoardSection`, page components): read the store and call its methods.
- Components never call the API; they go through a store.

## UI kit: PrimeNG, not Angular Material

PrimeNG has every component the design needs: toast, confirm dialog, select, multi-select, date picker, skeleton, avatar, menu. Angular Material, first-party with strong accessibility, lacks several of them. The wrappers cover PrimeNG's weaker spots.

## Charts: ECharts behind a layer

- One package service decides how charts look: theme tokens, fonts, reduced motion, right-to-left.
- One service per chart kind (donut, bar, line) turns plain data into options plus a data table.
- `ui-chart` renders it. ECharts registers only the parts used, draws SVG, and loads as its own chunk with the first chart.
- Each chart has a hidden table with the same numbers for screen readers.
