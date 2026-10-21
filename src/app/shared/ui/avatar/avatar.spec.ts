import { render, screen } from '@testing-library/angular';
import { UiAvatar } from './avatar';

describe('UiAvatar', () => {
  it('shows the initials and exposes the full name', async () => {
    await render(UiAvatar, { inputs: { initials: 'JD', name: 'John Doe' } });

    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.getByLabelText('John Doe')).toBeInTheDocument();
  });

  it.each([
    ['small', '1.5rem'],
    ['medium', '2rem'],
    ['large', '2.5rem'],
  ] as const)('sizes the %s avatar', async (size, box) => {
    const { fixture } = await render(UiAvatar, {
      inputs: { initials: 'JD', name: 'John Doe', size },
    });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.style.getPropertyValue('--p-avatar-width')).toBe(box);
    expect(host.style.getPropertyValue('--p-avatar-height')).toBe(box);
  });
});
