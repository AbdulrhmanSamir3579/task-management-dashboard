// Prints the Lighthouse scores of the representative runs as a Markdown table, for the
// GitHub Actions job summary. Reads the manifest written by `lhci autorun`.
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('lighthouse-report/manifest.json', 'utf8'));
const score = (value) => Math.round(value * 100);

const rows = manifest
  .filter((run) => run.isRepresentativeRun)
  .map(({ url, summary }) => {
    const path = new URL(url).pathname;
    return `| ${path} | ${score(summary.performance)} | ${score(summary.accessibility)} | ${score(summary['best-practices'])} | ${score(summary.seo)} |`;
  });

console.log(
  [
    '### Lighthouse',
    '',
    '| Page | Performance | Accessibility | Best practices | SEO |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
  ].join('\n'),
);
