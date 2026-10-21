import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { TaskEditorStore } from '../../features/tasks/data-access/task-editor.store';
import { provideUi } from '../../shared/ui/provide-ui';
import { Shell } from './shell';

@Component({ template: '<p>Page content</p>', changeDetection: ChangeDetectionStrategy.OnPush })
class StubPage {}

describe('Shell', () => {
  async function setup(url: string) {
    const { navigate } = await render(Shell, {
      providers: [provideUi(), provideHttpClient(), provideHttpClientTesting()],
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

  describe('mobile navigation', () => {
    const toggle = () =>
      within(screen.getByRole('banner')).getByRole('button', { name: /navigation/ });

    const expectExpanded = (expanded: boolean) =>
      vi.waitFor(() => expect(toggle()).toHaveAttribute('aria-expanded', String(expanded)));

    it('opens and closes the drawer from the menu button', async () => {
      await setup('/dashboard');
      await expectExpanded(false);

      await userEvent.click(toggle());
      await expectExpanded(true);
      expect(toggle()).toHaveAccessibleName('Close navigation');

      await userEvent.click(toggle());
      await expectExpanded(false);
    });

    it('closes with Escape, the backdrop or by following a link', async () => {
      await setup('/dashboard');
      const header = screen.getByRole('banner');
      const expectClosed = () => expectExpanded(false);

      await userEvent.click(toggle());
      await userEvent.keyboard('{Escape}');
      await expectClosed();

      await userEvent.click(toggle());
      await expectExpanded(true);
      const backdrop = screen
        .getAllByRole('button', { name: 'Close navigation' })
        .find((button) => !header.contains(button));
      await userEvent.click(backdrop!);
      await expectClosed();

      await userEvent.click(toggle());
      await userEvent.click(screen.getByRole('link', { name: /Tasks/ }));
      await expectClosed();
    });
  });

  it('opens the task form from the sidebar', async () => {
    await setup('/dashboard');

    await userEvent.click(screen.getByRole('button', { name: '+ New Task' }));

    expect(TestBed.inject(TaskEditorStore).open()).toBe(true);
  });

  it('moves focus to the page content with the skip link', async () => {
    await setup('/dashboard');

    await userEvent.click(screen.getByRole('link', { name: 'Skip to main content' }));

    expect(screen.getByRole('main')).toHaveFocus();
  });
});
