# 0016. Task form

- Status: Accepted
- Date: 2026-10-21

## Context

Tasks are created and edited in a modal (the assignment allows inline or modal editing). The assignment asks for Reactive Forms with custom validators, dynamic form controls, form state management and proper error display. The form is opened from three places: the toolbar and sidebar "New Task" buttons, and Edit in a card's menu.

## Decision

- **Typed Reactive Forms** with `NonNullableFormBuilder`. `TaskForm` is presentational: it validates and emits a `CreateTaskPayload`; saving, the user list and the duplicate-title lookup come from its parent.
- **Custom validators** (`task-form.validators.ts`), each error carrying its own message for `ui-form-field`:
  - `notBlank`: a title cannot be only spaces;
  - `uniqueTitle`: async, waits 300 ms after typing; Angular cancels the pending check when the value changes; a failed check never blocks saving (the server validates too). The lookup is local first: loaded tasks answer at once, the API otherwise (as in [0014](0014-local-first-search.md));
  - `dateNotBefore`: a new due date cannot be in the past, but an existing overdue date stays valid while editing;
  - `dateNotAfter`: a completion date cannot be in the future;
  - `maxItems` / `maxItemLength`: at most 5 tags of up to 20 characters.
- **Dynamic control**: "Completed on" is added with `addControl` when the status becomes Done and removed with `removeControl` otherwise. The API accepts it as `completedAt`; without it the server stamps the current time.
- **Errors** show under a field once it is touched. On submit, every field is marked touched, a pending title check is awaited, and focus moves to the first invalid field. The submit button is never disabled for validity, so users can always find out what is missing.
- **One dialog for the app**: `TaskEditorStore` (open, task id) is shared; `TaskEditorDialog` lives once in the shell, loaded after first paint, and is opened from anywhere.
- **Form state**: the dialog cannot be dismissed while saving; closing with unsaved changes asks "Discard changes?" (with "Keep editing"); an untouched form closes at once; when saving fails, the dialog stays open with the user's input and the store shows the error. `ui-dialog` gained a `beforeClose` guard for this, applied to the close button, Escape and a click outside.
- Selects inside a form field are named by the field's label through `aria-labelledby`, because a `<label for>` cannot name PrimeNG's combobox element.

## Consequences

- Validation rules are plain functions with their own tests; the form is tested by typing, choosing and submitting like a user.
- Opening the dialog from a new place needs only `TaskEditorStore.openCreate()` or `openEdit(id)`.
- The dialog and form (about 38 kB compressed) load after first paint, not with the initial bundle. The sidebar "New Task" button is a native button for the same reason.
