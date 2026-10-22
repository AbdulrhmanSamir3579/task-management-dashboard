// Prints the Lighthouse scores of the representative runs as Markdown tables, one per
// device, for the GitHub Actions job summary. Reads the manifests written by `lhci autorun`.
import { existsSync, readFileSync } from 'node:fs';

const score = (value) => Math.round(value * 100);
const lines = ['### Lighthouse'];

for (const device of ['desktop', 'mobile']) {
  const file = `lighthouse-report/${device}/manifest.json`;
  if (!existsSync(file)) {
    continue;
  }
  const manifest = JSON.parse(readFileSync(file, 'utf8'));
  lines.push(
    '',
    `#### ${device[0].toUpperCase()}${device.slice(1)}`,
    '',
    '| Page | Performance | Accessibility | Best practices | SEO |',
    '| --- | --- | --- | --- | --- |',
    ...manifest
      .filter((run) => run.isRepresentativeRun)
      .map(({ url, summary }) => {
        const path = new URL(url).pathname;
        return `| ${path} | ${score(summary.performance)} | ${score(summary.accessibility)} | ${score(summary['best-practices'])} | ${score(summary.seo)} |`;
      }),
  );
}

console.log(lines.join('\n'));
