# 0028. Simple CI/CD pipeline

- Status: Accepted
- Date: 2026-10-22
- Amends: [0004](0004-code-quality-and-delivery-workflow.md), [0025](0025-motion-accessibility-and-lighthouse.md), [0026](0026-deployment-to-github-pages.md)

## Context

The assignment asks for "GitHub Actions for automated testing and build". The pipeline had grown past that: four parallel jobs on every push (including a Lighthouse job of about five minutes), and a second workflow that started after CI passed on `main` to deploy. It was hard to follow what ran when.

## Decision

- **One workflow, `ci.yml`**, on every pull request and every merge to `main`:
  1. **Lint, test and build**, one job: install, lint (ESLint plus the translation check), format check, unit tests with the 80% coverage gate and a coverage summary, the GitHub Pages build, and the smoke test that starts the optimised bundle.
  2. **Deploy to GitHub Pages**, only for merges to `main` and only after the first job passed. It publishes the build the first job made and tested, so nothing is built twice.
- `deploy.yml` and its "wait for the other workflow" trigger are gone.
- A newer push to a pull request cancels its running check. Runs on `main` always finish, so a deployment is never cut off.
- **Lighthouse runs on demand**: `lighthouse.yml` starts from the Actions tab ("Run workflow") and uses the same minimums and reports as before. `npm run build && npm run lighthouse` runs it locally.

## Consequences

- A pull request gets one check that finishes in about three minutes, and a merge is live a little later.
- Lighthouse no longer blocks pull requests. The smoke test covers the failure it once caught (a production build that does not start), and Lighthouse should be run before a release or after a change that could affect performance or accessibility.
