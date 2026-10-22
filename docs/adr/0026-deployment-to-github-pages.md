# 0026. Deployment to GitHub Pages

- Status: Accepted
- Date: 2026-10-22

## Context

The assignment lists CI/CD as a bonus, and reviewers need a live demo they can open without installing anything. The app needs no server: the mock API runs in the browser ([0010](0010-in-memory-mock-backend.md)). The repository is public on GitHub, and CI already runs lint, tests, build and Lighthouse on every pull request and on `main` ([0004](0004-code-quality-and-delivery-workflow.md), [0025](0025-motion-accessibility-and-lighthouse.md)).

## Decision

- **GitHub Pages**, published by GitHub Actions (`.github/workflows/deploy.yml`) at https://abdulrhmansamir3579.github.io/task-management-dashboard/. It is free for public repositories, needs no extra account, and serves static files over HTTPS from a CDN.
- **Deploy only what CI approved**: the workflow runs on `workflow_run` when the CI workflow completes on `main`, and only if it succeeded. It checks out the exact commit CI tested (`head_sha`), so a commit that fails any check is never published. It can also be run by hand (`workflow_dispatch`).
- **Build for the sub-path**: `npm run build:pages` builds with `--base-href /task-management-dashboard/`. The app uses relative URLs everywhere (the API base is `api`, assets have no leading slash), so nothing else changes.
- **Deep links**: GitHub Pages has no rewrite rules, but it answers unknown paths with `404.html`. The workflow copies `index.html` there, so opening or reloading `/tasks?assignee=user-002` starts the app and the router shows the right page. The response status is 404, which matters for search engines but not for a demo.
- Deployments use the `github-pages` environment, which accepts deployments from `main` only. Concurrent runs queue rather than cancel a deployment in progress.
- A container image was considered and dropped: there is no server to run, and Pages already gives a public URL.

## Consequences

- Every merge to `main` is live a few minutes later, after the checks pass.
- Moving to a host with rewrite rules (Netlify, Vercel, Cloudflare Pages) would replace the `404.html` copy with a proper fallback that returns 200.
