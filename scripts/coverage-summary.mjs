// Prints the coverage totals as a Markdown table for the GitHub Actions run summary.
import { existsSync, readFileSync } from 'node:fs';

const project = 'task-management-dashboard';
const summaryPath = `coverage/${project}/coverage-summary.json`;

if (!existsSync(summaryPath)) {
  console.log('No coverage summary was produced.');
  process.exit(0);
}

const angularJson = JSON.parse(readFileSync('angular.json', 'utf8'));
const thresholds = angularJson.projects[project].architect.test.options.coverageThresholds ?? {};
const { total } = JSON.parse(readFileSync(summaryPath, 'utf8'));

const rows = ['statements', 'branches', 'functions', 'lines'].map((metric) => {
  const { pct, covered, total: count } = total[metric];
  const minimum = thresholds[metric] ?? 0;
  const status = pct >= minimum ? 'pass' : 'fail';
  return `| ${metric} | ${pct}% | ${covered}/${count} | ${minimum}% | ${status} |`;
});

console.log(
  [
    '### Coverage',
    '',
    '| Metric | Coverage | Covered | Minimum | Status |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
  ].join('\n'),
);
