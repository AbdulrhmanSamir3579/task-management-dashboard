// Prepares the production build for GitHub Pages, which has no rewrite rules:
// - one copy of index.html per top-level page, because Pages serves /tasks from tasks.html
//   with status 200, so deep links load normally for users, crawlers and Lighthouse;
// - 404.html for any other path, so the router can still show its "not found" page.
import { copyFileSync, readFileSync } from 'node:fs';

const dist = 'dist/task-management-dashboard/browser';
const navigation = readFileSync('src/app/core/layout/navigation.ts', 'utf8');
const pages = [...navigation.matchAll(/path: '\/([\w-]+)'/g)].map((match) => match[1]);

if (pages.length === 0) {
  throw new Error('No pages found in src/app/core/layout/navigation.ts');
}

for (const page of [...pages, '404']) {
  copyFileSync(`${dist}/index.html`, `${dist}/${page}.html`);
}
console.log(`Prepared ${pages.map((page) => `${page}.html`).join(', ')} and 404.html`);
