import { render } from '@testing-library/angular';
import { UiSkeleton } from './skeleton';

describe('UiSkeleton', () => {
  it('takes the size and shape of the content it replaces', async () => {
    const { container } = await render(UiSkeleton, {
      inputs: { width: '3rem', height: '3rem', shape: 'circle' },
    });

    const skeleton = container.querySelector<HTMLElement>('.p-skeleton');
    expect(skeleton).toHaveClass('p-skeleton-circle');
    expect(skeleton?.style.width).toBe('3rem');
    expect(skeleton?.style.height).toBe('3rem');
  });
});
