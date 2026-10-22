# 0025. Motion, accessibility checks and Lighthouse

- Status: Accepted
- Date: 2026-10-22
- Amends: [0007](0007-theming-from-design-tokens.md), [0011](0011-lazy-loading-and-bundle-budget.md)

## Context

The assignment asks for smooth transitions and animations, a responsive layout, accessibility, and, as a bonus, a Lighthouse score above 90. Accessibility had been handled feature by feature (names, roles, focus), but nothing checked it as a whole, and contrast cannot be checked in unit tests.

## Decision

- **Motion**:
  - Route changes use the View Transitions API (`withViewTransitions`). Only the page content fades and rises; the header and sidebar stay still, through `view-transition-name: page` on `<main>`.
  - Board cards fade into place with a plain CSS animation, which runs whenever an element is added to the page. Angular's `animate.enter` was tried first, but it pulled about 6 kB of animation code into the initial bundle for the same effect. There is no leave animation: during a drag it would leave a ghost card in the old column.
  - One global `prefers-reduced-motion` rule turns animations and transitions off everywhere, PrimeNG included, replacing the per-component rules.
- **Accessibility checks in unit tests**: `expectNoAccessibilityViolations()` (`src/testing/axe.ts`) runs axe-core's WCAG 2.2 A and AA rules. Every page, each calendar view, the task dialog, the confirm dialog and the activity panel have such a test. Colour contrast needs real layout and is left to Lighthouse.
- **Lighthouse in CI** (`lighthouserc.json`, `lighthouserc.mobile.json`): every pull request audits Dashboard, Tasks and Analytics from the production build, three runs each.
  - Desktop must score at least 90 in every category (95 for accessibility).
  - Mobile must meet the same accessibility, best-practices and SEO minimums. Mobile performance is reported as a warning.
  - Scores go to the job summary, and full reports are a build artifact. Nothing is uploaded to an external service.
- **Fixes the audit found**:
  - The design's green, orange and red are under 4.5:1 as small text, and so is the grey `#757575` on the tinted backgrounds. They stay for borders, fills and charts. Small text uses new tokens: `--app-success-text`, `--app-warning-text`, `--app-danger-text` and a darker `--app-text-muted` (`#666666`), with dark-theme values. PrimeNG's red and muted colours in form messages and menus were replaced by these tokens.
  - PrimeNG's confirm dialog renders a hard-coded `role="alertdialog"` element without a name, even while closed. `ConfirmService` now keeps the question in a signal, and the outlet renders it with `ui-dialog`. Focus still starts on Cancel (`autofocus` on `ui-button`), and PrimeNG's `ConfirmationService` is gone.
  - The logo link had no name on phones, where its text is hidden; it now has an `aria-label`.
  - `robots.txt` was missing, so the SPA fallback served HTML for it.
- **Preloading when idle** (amends [0011](0011-lazy-loading-and-bundle-budget.md)): `IdlePreloadingStrategy` replaces `PreloadAllModules`. Lazy pages download once the browser is idle (at most 3 s), instead of right after the first navigation, when they competed with the first page and its data.

## Consequences

- Scores at the time of writing: desktop 98–99 performance and 100 for accessibility, best practices and SEO. On mobile, 100 for those three and 77–92 for performance.
- Mobile performance is held back by client-side rendering: on a throttled phone, nothing paints until Angular has started (about 2.6 s), and the Tasks board then waits for its lazy chunks and data. Server-side rendering or prerendering would be the next step if mobile performance became a requirement.
- axe and Lighthouse catch different problems, so both stay: axe on every page in unit tests, Lighthouse on real rendering in CI.
