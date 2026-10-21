import { render, screen } from '@testing-library/angular';
import { UiAvatar } from './avatar';

describe('UiAvatar', () => {
  it('shows the initials and exposes the full name', async () => {
    await render(UiAvatar, { inputs: { initials: 'JD', name: 'John Doe', size: 'large' } });

    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.getByLabelText('John Doe')).toHaveClass('p-avatar-xl');
  });
});
