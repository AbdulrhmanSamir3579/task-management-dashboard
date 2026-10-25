/**
 * jsdom ignores width media queries, so components render with their base styles, which
 * are the phone layout (the CSS is mobile-first). This applies the `min-width` rules up
 * to `width` to the styles already on the page, as a browser that wide would. Call it
 * after rendering; it lasts until the test ends.
 */
export function applyScreenWidth(width: number): void {
  for (const style of Array.from(document.head.querySelectorAll('style'))) {
    const css = style.textContent ?? '';
    const resolved = css.replace(/@media\s*\(\s*min-width:\s*([\d.]+)px\s*\)/g, (_, px: string) =>
      Number(px) <= width ? '@media all' : '@media not all',
    );
    if (resolved !== css) {
      style.textContent = resolved;
    }
  }
}

/** A desktop screen, wide enough for every layout except the widest grids. */
export const DESKTOP_WIDTH = 1024;
