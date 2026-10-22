// Checks the templates against the translation files (run in CI with `npm run i18n:check`):
// - every key a template uses exists in en.json, as a string or as a group of plural forms;
// - no user-facing text is written into a template instead of coming from a translation.
// Keys used in TypeScript are checked by the compiler through `TranslationKey`, and the
// tests check that en.json and ar.json have the same keys.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PLURAL_FORMS = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);
const ATTRIBUTES =
  'label|placeholder|title|message|heading|hint|emptyMessage|ariaLabel|aria-label|triggerLabel|confirmLabel|cancelLabel|description|listLabel';
// Text that is code, not language.
const ALLOWED_TEXT = new Set(['?chaos=0.3']);

function keysOf(catalogue, prefix = '') {
  return Object.entries(catalogue).flatMap(([key, value]) => {
    if (typeof value === 'string') {
      return [`${prefix}${key}`];
    }
    const forms = Object.keys(value);
    const isPlural = forms.every((form) => PLURAL_FORMS.has(form));
    return isPlural ? [`${prefix}${key}`] : keysOf(value, `${prefix}${key}.`);
  });
}

function filesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

/** Template text of a file: the file itself for .html, inline `template:` for .ts. */
function templateOf(path) {
  const source = readFileSync(path, 'utf8');
  if (path.endsWith('.html')) {
    return source;
  }
  // The component property only, at the start of a line (not the word in a comment).
  return [...source.matchAll(/^\s*template: `([\s\S]*?)`/gm)].map((match) => match[1]).join('\n');
}

const known = new Set(
  keysOf(JSON.parse(readFileSync('src/app/core/i18n/translations/en.json', 'utf8'))),
);
const problems = [];

for (const path of filesUnder('src/app')) {
  if (!/\.(html|ts)$/.test(path) || path.endsWith('.spec.ts')) {
    continue;
  }
  const template = templateOf(path).replace(/<!--[\s\S]*?-->/g, '');
  if (!template) {
    continue;
  }

  for (const [, key] of template.matchAll(/'([A-Z][A-Z0-9_]*(?:\.[A-Z0-9_]+)+)'/g)) {
    if (!known.has(key)) {
      problems.push(`${path}: unknown translation key ${key}`);
    }
  }

  const attribute = new RegExp(`\\s(${ATTRIBUTES})="([^"]*[A-Za-z]{2,}[^"]*)"`, 'g');
  for (const [, name, value] of template.matchAll(attribute)) {
    problems.push(`${path}: ${name}="${value}" should come from a translation`);
  }

  const text = template
    .replace(/{{[\s\S]*?}}/g, ' ')
    .replace(/<[^>]*>/g, '\n')
    .replace(
      /@(if|for|else if|else|switch|case|default|empty|defer|placeholder|loading|let)\b[^{\n]*\{?/g,
      ' ',
    )
    .replace(/[{}]/g, ' ');
  for (const line of text.split('\n').map((part) => part.trim())) {
    if (/[A-Za-z]{2,}/.test(line) && !ALLOWED_TEXT.has(line)) {
      problems.push(`${path}: text "${line}" should come from a translation`);
    }
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} translation problem(s) found.`);
  process.exit(1);
}
console.log(`Translations OK: ${known.size} keys.`);
