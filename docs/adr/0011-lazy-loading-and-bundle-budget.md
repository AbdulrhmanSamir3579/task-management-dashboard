# 0011. Lazy loading and bundle budget

- Status: Accepted
- Date: 2026-10-21

## Context

The assignment asks for lazy loading, code splitting and good performance (a Lighthouse score above 90 is a bonus). The Angular CLI's default warning budget for the initial bundle is 500 kB.

Measured on a production build: the initial bundle is about 620 kB raw (about 149 kB transferred). The largest single part is PrimeNG's Aura preset (about 133 kB), which holds the design tokens of every PrimeNG component and is needed before the first paint.

## Decision

- Every page is a lazy route (`loadComponent`), so the initial bundle holds only the shell. Pages are preloaded in the background after start-up (`PreloadAllModules`), so navigation stays instant.
- Overlays that are not needed for the first paint load with `@defer (on idle)`: the toast outlet (about 9 kB transferred) and the confirm dialog outlet (about 14 kB).
- The mock database seed loads as its own chunk the first time the API is called.
- The initial budget is raised to a 650 kB warning (error stays at 1 MB), with this record as the reason. Any growth beyond it has to be justified or removed.
- Zoneless change detection and OnPush keep runtime work low.

## Consequences

- First paint downloads about 149 kB of compressed JavaScript; everything else arrives on demand.
- A toast or confirmation can only appear once the browser has been idle after start-up, which happens long before a user can trigger one.
- Charts (ECharts) will load in their own chunk inside `@defer` blocks.
