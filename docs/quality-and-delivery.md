# Quality and delivery

## Testing: Vitest and Testing Library

- **Vitest** through Angular's own unit-test builder, the Angular CLI default, with jsdom.
- **Angular Testing Library** with `user-event`: components are tested the way people use them, by role, label and text, so tests survive refactors.
- **`HttpTestingController`** for stores and services; retries, errors and the mock API are also tested through the real interceptors.
- **axe-core** checks every page and dialog for accessibility violations.
- **Arabic:** a helper renders components in Arabic to test right-to-left text and plurals.
- **Smoke test:** the production build is started in a headless DOM under its GitHub Pages path. It was added after a bug that only appeared in the minified build (the app never started), so that kind of failure is caught before deploying.
- **Coverage gate:** 80% for statements, branches, functions and lines, over every file in `src/app`. Currently about 98%.
- Regression tests are run once against the broken code, to confirm they fail without the fix.

Compared with Karma and Jasmine (deprecated) and Jest (extra setup), Vitest needs no extra configuration in Angular 22.

## Code quality

- **ESLint** with `angular-eslint`, including the template accessibility rules and the three import boundaries.
- **Prettier** for formatting.
- **Husky and lint-staged** run ESLint and Prettier on staged files before each commit.
- **commitlint** enforces [Conventional Commits](https://www.conventionalcommits.org/).

## Workflow

- One focused pull request per change, opened as a draft, marked ready when CI is green.
- Merge commits only, so every commit stays in the history.
- Big decisions are written down in these docs, in the same pull request as the change.

## CI/CD: one simple workflow

`ci.yml` runs on every pull request and every merge to `main`:

1. **Lint, test and build** (one job): install, lint and translation check, format check, tests with the coverage gate, the GitHub Pages build, the smoke test.
2. **Deploy to GitHub Pages**, only on `main` and only after the first job passed, using the build it tested.

Lighthouse runs on demand (`lighthouse.yml`, from the Actions tab), so pull requests stay fast.

## Hosting: GitHub Pages, not Docker

GitHub Pages is free, serves over HTTPS from a CDN and gives a public demo URL. There is no server to run, so a container image was left out on purpose.

- `build:pages` builds with the `/task-management-dashboard/` base path.
- Pages has no rewrite rules, so the build writes a copy of the app for each page (`tasks.html`, ...) and a `404.html`: deep links load directly with status 200.
- Pages sets a 10-minute cache lifetime on assets, which can't be changed there.
