// Starts the production build in jsdom and fails if the app does not render its shell.
// Unit tests run unminified code; this catches start-up failures that only happen in the
// optimised bundle (a provider misread after minification once left the page blank).
import { readFileSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

const dist = 'dist/task-management-dashboard/browser';
const errors = [];

const virtualConsole = new VirtualConsole();
virtualConsole.on('error', (...args) => errors.push(args.map(String).join(' ')));
virtualConsole.on('jsdomError', (error) => errors.push(error.message));

// The inline script in index.html is skipped; the bundle is imported below instead.
const html = readFileSync(`${dist}/index.html`, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
// Opened under the build's base path, e.g. /task-management-dashboard/ for GitHub Pages.
const base = html.match(/<base href="([^"]*)"/)?.[1] ?? '/';
const { window } = new JSDOM(html, {
  url: `http://localhost${base}dashboard`,
  pretendToBeVisual: true,
  virtualConsole,
});

// Browser features jsdom lacks, as in the unit test setup.
const noop = () => undefined;
window.matchMedia ??= (media) => ({
  matches: false,
  media,
  addEventListener: noop,
  removeEventListener: noop,
});
window.ResizeObserver ??= class {
  observe = noop;
  unobserve = noop;
  disconnect = noop;
};
window.requestIdleCallback ??= (callback) => setTimeout(callback, 1);
window.cancelIdleCallback ??= (id) => clearTimeout(id);
window.scrollTo = noop;

for (const key of Object.getOwnPropertyNames(window)) {
  if (!(key in globalThis)) {
    globalThis[key] = window[key];
  }
}
for (const key of ['window', 'document', 'navigator', 'location', 'localStorage', 'history']) {
  Object.defineProperty(globalThis, key, {
    value: key === 'window' ? window : window[key],
    configurable: true,
  });
}
process.on('unhandledRejection', (error) => errors.push(String(error?.stack ?? error)));
process.on('uncaughtException', (error) => errors.push(String(error?.stack ?? error)));

const main = readdirSync(dist).find((file) => /^main-.*\.js$/.test(file));
await import(pathToFileURL(`${dist}/${main}`).href);
await new Promise((resolve) => setTimeout(resolve, 2000));

const rendered = window.document.querySelector('app-shell main') !== null;
if (!rendered || errors.length) {
  console.error(rendered ? 'The app started with errors:' : 'The app did not render its shell.');
  console.error(errors.join('\n\n'));
  process.exit(1);
}
console.log('Smoke test passed: the production build renders the app shell.');
process.exit(0);
