# 0006. UI library behind wrapper components

- Status: Accepted
- Date: 2026-10-21

## Context

PrimeNG gives most of the components the design needs (toast, confirm dialog, skeleton, avatar, tag, select, multi-select, date picker, menu), but it has a history of breaking changes between majors (theming rewrite and component renames in v18, theme package moved in v20) and of lagging behind Angular releases. Angular Material was considered: it is first-party with the strongest accessibility, but lacks several of these components.

## Decision

- Use PrimeNG, but only inside `src/app/shared/ui`. Features use our `ui-*` components and services; ESLint blocks `primeng` and `@primeuix` imports everywhere else.
- Wrapper APIs use our own types (`ButtonVariant`, `Tone`, `ControlSize`, `SelectOption`, `MenuAction`); PrimeNG types and events never reach features.
- Form wrappers implement `ControlValueAccessor` through a shared base class (`UiFormControl`), so they work with Reactive Forms. Inside a `ui-form-field` they receive their id, error state and `aria-describedby` automatically.
- `ui-date-picker` works with `YYYY-MM-DD` strings, the API format, so features never handle `Date` objects.
- `ui-tags-input` is built from PrimeNG's input and chips, because PrimeNG's own tags component cannot pass an id or label to its input.
- Dialogs are declarative (`<ui-dialog [(visible)]>`) rather than opened from a service. Toasts and confirmations go through `NotificationService` and `ConfirmService` (`confirm()` returns `Promise<boolean>`, focus starts on Cancel), rendered by one outlet each in the shell.
- Gaps found in PrimeNG are fixed in the wrapper, for example the dialog close button now always has an accessible name.
- Charts follow the same rule with ECharts in `src/app/shared/charts` (one package service, one service per chart kind, one chart component).

## Consequences

- A PrimeNG upgrade or rename, or even a switch to another library, changes `shared/ui` only.
- Wrappers expose a chosen subset of options; a new need means extending the wrapper first.
- Component tests use the wrappers, so they keep passing when PrimeNG internals change.
