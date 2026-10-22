# 0024. Dark mode and settings

- Status: Accepted
- Date: 2026-10-22
- Amends: [0007](0007-theming-from-design-tokens.md), [0018](0018-chart-layer.md)

## Context

[0007](0007-theming-from-design-tokens.md) prepared dark mode: every colour is an `--app-*` token, PrimeNG switches with the `.app-dark` class, and only a partial set of dark values existed. The sidebar has a Settings item, and the extra pages were agreed to stay lightweight.

## Decision

- **Settings page**: an Appearance card with Light, Dark and System as native radio buttons styled as cards (each hint is read as the description, not as part of the name), and a Demo data card that explains the in-browser mock API and links to a run with `?chaos=0.3` to see the error handling.
- **`ThemeService`** keeps the choice in `localStorage` (through `BrowserStorage`) and resolves it to light or dark: "System" follows `prefers-color-scheme`, including changes while the app is open. An effect toggles the dark-mode class on `<html>`. It starts with the app through `provideAppInitializer`.
- **Light is the default**, matching the design. "System" is one click away.
- **No flash on reload**: a short inline script in `index.html` applies a saved dark theme before Angular starts. It shares the storage key and class name with `ThemeService`.
- **Complete dark tokens**: like PrimeNG's Aura dark scheme, the primary colour moves to the lighter 400 shade (`#42A5F5`) with dark text on it, and green, orange and red get lighter, so text keeps at least 4.5:1 contrast on the dark surfaces. New tokens `--app-primary-hover` and `--app-danger-contrast` replace the last hard-coded colours. `color-scheme` is set per theme, so native controls and scrollbars match.
- **Charts follow the theme** ([0018](0018-chart-layer.md)): `EchartsService.theme()` reads a signal that a `MutationObserver` bumps whenever the class or inline style on `<html>` changes. Charts are built in `computed()`, so they are rebuilt with the new token values without the chart code knowing about `ThemeService`.
- `DARK_MODE_CLASS` lives in its own small module. Importing it from `provide-ui.ts` made the lazy Settings page share PrimeNG's configuration with the main bundle, which split the initial JavaScript into an extra chunk and added about 2 kB transferred.

## Consequences

- Every page, PrimeNG component and chart switches theme at once, and the choice survives reloads.
- The inline script is the one piece of JavaScript outside Angular; a strict Content Security Policy would need its hash.
