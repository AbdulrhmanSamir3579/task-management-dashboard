# 0007. Theming from design tokens

- Status: Accepted, amended by [0024](0024-dark-mode-and-settings.md)
- Date: 2026-10-21

## Context

The Figma design defines a small palette (primary `#1976D2`, background `#F5F7FA`, text `#212121` and `#757575`, border `#E0E0E0`, green, orange and red for status), two shadows, two radii and the Inter font. PrimeNG components and our own components must look like one system, including a dark mode later.

## Decision

- Design tokens are CSS custom properties (`--app-*`) in `src/styles.scss`, with dark values under `.app-dark`. App components only use these variables.
- The PrimeNG preset (`definePreset(Aura)` in `shared/ui/theme/app-preset.ts`) uses a primary scale built around `#1976D2` as its 500 shade, so PrimeNG buttons, focus rings and selections match.
- PrimeNG styles live in a CSS layer (`cssLayer: true`), so app styles win without `!important`.
- Component sizes that differ from PrimeNG's are set through PrimeNG's own CSS variables on the wrapper host (for example `--p-avatar-width` for 24 px and 40 px avatars) instead of overriding internal classes.
- Inter is loaded from Google Fonts with `display=swap`; the system font stack is the fallback.

## Consequences

- Colours are changed in one place, and dark mode only needs the `.app-dark` class on `<html>`.
- PrimeNG internals are never targeted with `::ng-deep`, so upgrades do not silently break styles.
