import { TestBed } from '@angular/core/testing';
import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { THEME_STORAGE_KEY } from '../../core/theme/theme.service';
import { DARK_MODE_CLASS } from '../../shared/ui/theme/dark-mode';
import { SettingsPage } from './settings.page';

describe('SettingsPage', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(DARK_MODE_CLASS);
  });

  async function setup() {
    await render(SettingsPage);
    return within(screen.getByRole('group', { name: 'Theme' }));
  }

  it('offers light, dark and system themes with light chosen', async () => {
    const themes = await setup();

    expect(themes.getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual([
      'light',
      'dark',
      'system',
    ]);
    expect(themes.getByRole('radio', { name: 'Light' })).toBeChecked();
    expect(themes.getByRole('radio', { name: 'Dark' })).toHaveAccessibleDescription(
      'Easier on the eyes at night',
    );
  });

  it('switches the app to dark and remembers it', async () => {
    const themes = await setup();

    await userEvent.click(themes.getByRole('radio', { name: 'Dark' }));
    TestBed.tick();

    expect(themes.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(document.documentElement).toHaveClass(DARK_MODE_CLASS);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('explains the demo data and links to a run with simulated failures', async () => {
    await setup();

    expect(screen.getByRole('heading', { name: 'Demo data' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try with simulated failures' })).toHaveAttribute(
      'href',
      'dashboard?chaos=0.3',
    );
  });
});
