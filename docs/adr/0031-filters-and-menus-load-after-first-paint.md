# 0031. Filters and menus load after first paint

- Status: Accepted
- Date: 2026-10-23
- Amends: [0029](0029-dialogs-load-on-first-use.md)

## Context

After [0029](0029-dialogs-load-on-first-use.md), PageSpeed Insights still showed 200–350 ms of Total Blocking Time on the live Tasks page, the only metric costing real points. The page's critical path included three PrimeNG chunks (about 96 kB): MultiSelect with Menu, Select with Checkbox and Tooltip, and Overlay with VirtualScroller. The filter dropdowns render on load and need them; the card menus only rendered on first click, but `ui-menu` imported PrimeNG's `Menu` statically, so its code came with the page anyway. Angular also ran a view transition on the very first navigation, which has nothing to animate from.

## Decision

- **Filter dropdowns load once the board has drawn and the browser is idle**: `TaskFilterBar` wraps them in `@if (ready()) { @defer (on idle) }`, and `TaskBoardSection` passes `store.hasLoaded()` as `ready`. Without the wait, the idle callback fired while the task data was still on its way, and rendering the dropdowns delayed the board's first paint (LCP +100 ms on desktop, +400 ms on mobile). Until then, `ui-select-placeholder` shows look-alikes with the current filters ("All priorities", "High", "2 selected", "Sarah Smith"). The look-alike uses PrimeNG's form-field tokens and line height, so the swap does not move the page. It is hidden from assistive technology because it cannot be used.
- **Menu code loads when idle**: `ui-menu` puts `p-menu` in `@defer (when rendered(); prefetch on idle)`. The code downloads in the background after load, so the first click still opens at once. The menu is reached through a template reference typed by a local interface, not by `Menu`, so the import stays deferrable.
- **No view transition on the first load**: `withViewTransitions({ skipInitialTransition: true })`. Moving between pages still animates.
- **Tests let deferred blocks run**: Testing Library defaults to `DeferBlockBehavior.Manual`, so specs that open menus or dropdowns use `Playthrough`, and placeholder tests keep `Manual` to check the look-alikes.

## Consequences

- Measured with the Lighthouse workflow (median of 3 runs, main and this change run at the same time):

  | Page      | Mobile TBT   | Mobile score | Desktop TBT | Desktop score |
  | --------- | ------------ | ------------ | ----------- | ------------- |
  | Tasks     | 448 → 137 ms | 66 → 76      | 21 → 0 ms   | 98 → 98       |
  | Dashboard | 412 → 130 ms | 82 → 92      | 31 → 0 ms   | 98 → 98       |
  | Analytics | 268 → 50 ms  | 79 → 91      | 0 → 0 ms    | 98 → 99       |

  Layout shift is unchanged (0.000–0.007). Mobile LCP on Tasks is about 0.25 s later (5.0 → 5.26 s); it is limited by client-side rendering, as before.

- The tasks route no longer downloads or runs PrimeNG's select, multi-select and menu code before the board shows.
- For a moment after load (a split second on desktop), the filters cannot be opened; a click then does nothing. Filters from the URL apply to the board at once, as they live in the store.
- A deferred block hides its dependencies from the page bundle only if nothing else in the file references them; `ui-menu` must not go back to `viewChild(Menu)`.
