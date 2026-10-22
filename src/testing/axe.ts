import axe from 'axe-core';

/**
 * Runs axe's WCAG 2.2 A and AA rules on what is rendered. Colour contrast needs real
 * layout, which jsdom does not have, so it is checked by Lighthouse in CI instead.
 */
export async function expectNoAccessibilityViolations(
  context: Element = document.body,
): Promise<void> {
  const { violations } = await axe.run(context, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    rules: { 'color-contrast': { enabled: false } },
  });
  const report = violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} → ${violation.nodes
        .map((node) => node.target.join(' '))
        .join(', ')}`,
  );
  expect(report).toEqual([]);
}
