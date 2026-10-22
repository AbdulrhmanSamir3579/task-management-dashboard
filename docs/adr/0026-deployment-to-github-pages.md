# 0026. Deployment to GitHub Pages

- Status: Accepted, amended by [0028](0028-simple-ci-cd-pipeline.md)
- Date: 2026-10-22

## Context

The assignment lists CI/CD as a bonus, and reviewers need a live demo they can open without installing anything. The app needs no server: the mock API runs in the browser ([0010](0010-in-memory-mock-backend.md)). The repository is public on GitHub, and CI already runs lint, tests, build and Lighthouse on every pull request and on `main` ([0004](0004-code-quality-and-delivery-workflow.md), [0025](0025-motion-accessibility-and-lighthouse.md)).

## Decision

- **GitHub Pages**, published by GitHub Actions (`.github/workflows/deploy.yml`) at https://abdulrhmansamir3579.github.io/task-management-dashboard/. It is free for public repositories, needs no extra account, and serves static files over HTTPS from a CDN.
- **Deploy only what CI approved**: the workflow runs on `workflow_run` when the CI workflow completes on `main`, and only if it succeeded. It checks out the exact commit CI tested (`head_sha`), so a commit that fails any check is never published. It can also be run by hand (`workflow_dispatch`).
- **Build for the sub-path**: `npm run build:pages` builds with `--base-href /task-management-dashboard/`. The app uses relative URLs everywhere (the API base is `api`, assets have no leading slash), so nothing else changes.
- **Deep links**: GitHub Pages has no rewrite rules. `scripts/prepare-pages.mjs` copies `index.html` to one file per top-level page (`tasks.html`, `calendar.html`, …, read from `navigation.ts`), which Pages serves for `/tasks` with status 200, and to `404.html` for any other path, where the router shows its "not found" page. An earlier version used only `404.html`. Deep links then loaded with status 404, which cost SEO and Best Practices points in PageSpeed Insights.
- Deployments use the `github-pages` environment, which accepts deployments from `main` only. Concurrent runs queue rather than cancel a deployment in progress.
- A container image was considered and dropped: there is no server to run, and Pages already gives a public URL.

## Consequences

- Every merge to `main` is live a few minutes later, after the checks pass.
- A new top-level page needs no deployment change, as long as it is in the navigation.
- Moving to a host with rewrite rules (Netlify, Vercel, Cloudflare Pages) would replace the copies with one fallback rule.
