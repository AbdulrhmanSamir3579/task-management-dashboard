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

// jsdom has no scrollIntoView; PrimeNG lists call it to keep the focused option visible.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => undefined;
}

// jsdom has no ResizeObserver; ngx-echarts refuses to start without one.
if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe = (): undefined => undefined;
    unobserve = (): undefined => undefined;
    disconnect = (): undefined => undefined;
  };
}
