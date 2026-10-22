import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { UiButton } from './button';

describe('UiButton', () => {
  it('shows its label and reports clicks', async () => {
    const clicked = vi.fn();
    await render(UiButton, { inputs: { label: 'Save' }, on: { clicked } });

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(clicked).toHaveBeenCalledTimes(1);
  });

  it('does not report clicks while disabled', async () => {
    const clicked = vi.fn();
    await render(UiButton, { inputs: { label: 'Save', disabled: true }, on: { clicked } });

    const button = screen.getByRole('button', { name: 'Save' });
    await userEvent.click(button);

    expect(button).toBeDisabled();
    expect(clicked).not.toHaveBeenCalled();
  });

  it('is disabled while loading', async () => {
    await render(UiButton, { inputs: { label: 'Save', loading: true } });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it.each([
    ['danger', 'p-button-danger'],
    ['secondary', 'p-button-secondary'],
    ['ghost', 'p-button-text'],
    ['outline', 'p-button-outlined'],
  ] as const)('renders the %s variant', async (variant, cssClass) => {
    await render(UiButton, { inputs: { label: 'Go', variant } });
    expect(screen.getByRole('button', { name: 'Go' })).toHaveClass(cssClass);
  });

  it('uses the aria label for icon-only buttons and the given type', async () => {
    await render(UiButton, {
      inputs: { ariaLabel: 'Close dialog', type: 'submit', size: 'small' },
    });

    const button = screen.getByRole('button', { name: 'Close dialog' });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveClass('p-button-sm');
  });
});
