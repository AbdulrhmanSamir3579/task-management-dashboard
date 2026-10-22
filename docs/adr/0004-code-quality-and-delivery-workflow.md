# 0004. Code quality and delivery workflow

- Status: Accepted, amended by [0028](0028-simple-ci-cd-pipeline.md)
- Date: 2026-10-21

## Context

The assignment asks for ESLint, Prettier, Husky on pre-commit, meaningful (preferably conventional) commits and a clean history. Architecture rules, such as "features never import PrimeNG", should be enforced by tools rather than by review.

## Decision

- **ESLint** (flat config, angular-eslint recommended + accessibility rules), plus:
  - `prefer-signals`, `prefer-output-readonly`, `consistent-type-imports`, `no-non-null-assertion` (allowed in specs), `no-console` (warn and error allowed), `eqeqeq`;
  - template rules: self-closing tags, `@empty`, contextual `@for` variables, `button` types, no `$any`;
  - selector prefixes `app` and `ui`;
  - `no-restricted-imports`: `HttpClient` and `httpResource` only in `core/http`, PrimeNG only in `shared/ui`, ECharts only in `shared/charts`.
- **Component files**: a small component may keep its template (up to 20 lines) and styles (up to 15 lines) inline; anything bigger lives in `.html` and `.scss` files next to the class. `@angular-eslint/component-max-inline-declarations` enforces the limits, so the codebase cannot drift into a mix.
- **Prettier** (100 columns, single quotes); `eslint-config-prettier` turns off overlapping rules. The provided `data-fetching/` files and `DATA_README.md` are left untouched.
- **Husky**: `pre-commit` runs lint-staged (ESLint fix and Prettier on staged files only); `commit-msg` runs commitlint with conventional commits, headers up to 72 characters.
- **CI** (GitHub Actions) on every pull request and push to `main`: lint and format check, unit tests with the coverage gate (HTML report as an artifact, coverage table in the run summary), production build. A newer push cancels the running workflow.
- **Git**: one focused pull request per slice of work, commits pushed as they are made, merged with merge commits so every commit stays in the history.

## Consequences

- Every commit on `main` is formatted, lint-clean and conventionally named; CI repeats the checks because hooks can be skipped with `--no-verify`.
- Breaking an architecture rule fails lint with a message that names the wrapper to use instead.
