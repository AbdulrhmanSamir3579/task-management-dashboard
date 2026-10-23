# 0029. Dialogs load on first use

- Status: Accepted, amended by [0031](0031-filters-and-menus-load-after-first-paint.md)
- Date: 2026-10-22
- Amends: [0011](0011-lazy-loading-and-bundle-budget.md)

## Context

PageSpeed Insights scored the live Tasks page 77 for desktop performance: first and largest paint were fast (0.6 s and 1.1 s), but Total Blocking Time was 450 ms, with nine long tasks. [0011](0011-lazy-loading-and-bundle-budget.md) loaded the toast outlet, the confirm dialog and the task editor with `@defer (on idle)`, right after first paint. The editor brings the whole task form with PrimeNG's select, date picker, multi-select and checkbox (about 140 kB of its own code, plus shared chunks), so its code ran on the main thread while the page was still being measured. Nobody needs it until they open a task.

## Decision

- **The task editor loads when it is first opened**: `@defer (when taskEditor.open())` in the shell. The first open waits for one small chunk; later opens are instant.
- **The confirm dialog loads the first time a question is asked**: `@defer (when confirm.question() !== null)`. `ConfirmService` already keeps the question in a signal, so the outlet shows it as soon as it has loaded.
- **Card menus are created on first open**: `ui-menu` renders its PrimeNG menu only after its button is first pressed, so a board renders light native buttons instead of one PrimeNG menu per card.
- **The toast outlet still loads right after first paint**: PrimeNG's toast only shows messages sent after it exists, so it must be ready before the first one. The header search box and the 🔔 stay on idle too: they are small and visible at once.
- **Initial budget warning raised to 700 kB** (the error stays at 1 MB). ngx-translate and the i18n setup ([0027](0027-arabic-and-english.md)) added about 20 kB to the initial bundle, which brought it to the old 650 kB limit; reading the confirm question in the shell then went 0.5 kB over it.

## Consequences

- Measured with the Lighthouse workflow (median of 3 runs), before → after: desktop performance 98 on every page (Dashboard was 87), and mobile blocking time down by 40–60% (Dashboard 380 → 140 ms, Tasks 340 → 220 ms, Analytics 210 → 120 ms).
- Start-up no longer parses and runs the form and dialog code, which removes the largest block of main-thread work after first paint.
- The first "New Task", "Edit" or "Delete" of a visit waits for a chunk download. It is cached after that, and on GitHub Pages it is small enough not to be noticed.
