import { render, screen } from '@testing-library/angular';
import { UiTag } from './tag';

describe('UiTag', () => {
  it.each([
    ['neutral', 'p-tag-secondary'],
    ['info', 'p-tag-info'],
    ['success', 'p-tag-success'],
    ['warning', 'p-tag-warn'],
    ['danger', 'p-tag-danger'],
  ] as const)('maps the %s tone', async (tone, cssClass) => {
    const { container } = await render(UiTag, { inputs: { label: 'High', tone } });

    expect(screen.getByText('High')).toBeInTheDocument();
    expect(container.querySelector('.p-tag')).toHaveClass(cssClass);
  });
});
