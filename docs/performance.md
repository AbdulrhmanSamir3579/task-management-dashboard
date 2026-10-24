# Performance

## The rule: nothing loads before it is needed

| What                                 | When it loads                                                |
| ------------------------------------ | ------------------------------------------------------------ |
| Pages                                | Lazy routes, preloaded once the browser is idle              |
| Task dialog, confirm dialog          | The first time they open (`@defer (when ...)`)               |
| Header search, activity bell, toasts | Right after first paint (`@defer (on idle)`)                 |
| Card menus                           | Created on first click; their code downloads when idle       |
| Filter dropdowns                     | After the board has drawn, when idle; look-alikes until then |
| ECharts                              | Its own chunk, with the first chart                          |
| Mock data, translations              | Their own chunks                                             |

Also: zoneless with OnPush, `@for` with `track`, `Intl` instead of `DatePipe` (no locale data in the bundle), the first page load skips the view transition, and bundle budgets in `angular.json` fail the build if the initial bundle grows.

## Measured, not guessed

The performance changes were checked with the manual Lighthouse workflow on CI (median of 3 runs), comparing `main` and the branch at the same time.

| Page      | Mobile blocking time | Mobile score | Desktop score |
| --------- | -------------------- | ------------ | ------------- |
| Tasks     | 448 → 137 ms         | 66 → 76      | 98            |
| Dashboard | 412 → 130 ms         | 82 → 92      | 98            |
| Analytics | 268 → 50 ms          | 79 → 91      | 99            |

Before that, loading the dialogs on first use raised desktop to 98 on every page. PageSpeed Insights on the live site: Accessibility, Best Practices and SEO 100.

Two lessons from the measurements:

- **Idle is not always after the content.** Loading the filter dropdowns "on idle" first delayed the board, because idle came before the task data arrived. They now wait for the board to draw.
- **Placeholders must match exactly.** The filter look-alikes were 4 px shorter than the real dropdowns until they used the same line height, which caused a small layout shift.

## Known limit and next step

On a throttled phone, the Tasks page shows its content after about 5 seconds: client-side rendering plus the 400 ms simulated latency. Server-side rendering or prerendering with hydration is the next step. Browser APIs are already reached through `DOCUMENT` and a storage wrapper, so the code is ready for it.
