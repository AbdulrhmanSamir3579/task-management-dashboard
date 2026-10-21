// Adds DOM matchers such as toBeInTheDocument() and toHaveAccessibleName() to Vitest's expect.
import '@testing-library/jest-dom/vitest';

// jsdom has no matchMedia; PrimeNG overlays use it to pick responsive behaviour.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}
