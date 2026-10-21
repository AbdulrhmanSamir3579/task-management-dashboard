# 0003. Angular 22, standalone, zoneless and strict

- Status: Accepted
- Date: 2026-10-21

## Context

The assignment targets "Angular 20/21.next". When the project started, Angular 22.2 was the latest release and every library needed (PrimeNG 22, ngx-echarts 22, angular-in-memory-web-api 0.22, NgRx 22) shipped native Angular 22 support, so no npm `overrides` were required.

## Decision

- Angular 22 with standalone components only and zoneless change detection (the Angular 22 default).
- OnPush everywhere. It is the default in Angular 22, but it is still written on every component and set in the schematics, so the intent is visible.
- Strict TypeScript (`strict`, `noUncheckedIndexedAccess`) and strict templates (`strictTemplates`, `strictStandalone`, `typeCheckHostBindings`), all set explicitly.
- Modern APIs: `input()`, `output()`, `model()`, `inject()`, `@if` / `@for` / `@defer`.
- Node 24 LTS in CI (`.nvmrc`); the `engines` field also allows Node 22 and 26.

## Consequences

- Change detection only runs for signal changes and events, which suits the signal-based stores.
- `noUncheckedIndexedAccess` makes array and record lookups possibly `undefined`, so code handles missing values explicitly.
- The project is one major ahead of the version named in the assignment.
