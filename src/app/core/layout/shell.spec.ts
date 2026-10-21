import { ChangeDetectionStrategy, Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { provideUi } from '../../shared/ui/provide-ui';
import { Shell } from './shell';

@Component({ template: '<p>Page content</p>', changeDetection: ChangeDetectionStrategy.OnPush })
class StubPage {}

describe('Shell', () => {
  async function setup(url: string) {
    const { navigate } = await render(Shell, {
      providers: [provideUi()],
      routes: [
        { path: 'dashboard', title: 'Dashboard', component: StubPage },
        { path: 'tasks', title: 'Tasks', component: StubPage },
      ],
    });
    await navigate(url);
  }

  it('lists every page in the main navigation', async () => {
    await setup('/dashboard');

    const links = screen.getAllByRole('link').map((link) => link.textContent?.trim());
    expect(links).toEqual(
      expect.arrayContaining([
        '📊 Dashboard',
        '✅ Tasks',
        '📅 Calendar',
        '📈 Analytics',
        '👥 Team',
        '⚙️ Settings',
      ]),
    );
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });

  it('shows the active page title and marks its link as current', async () => {
    await setup('/tasks');

    expect(await screen.findByRole('heading', { level: 1, name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Tasks/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Dashboard/ })).not.toHaveAttribute('aria-current');
  });

  it('renders the routed page inside the main landmark', async () => {
    await setup('/dashboard');
    expect(screen.getByRole('main')).toHaveTextContent('Page content');
  });
});
