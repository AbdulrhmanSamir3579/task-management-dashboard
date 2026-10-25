import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { TaskEditorStore } from '../../features/tasks/data-access/task-editor.store';
import { ConfirmService } from '../../shared/ui/confirm/confirm.service';
import { provideUi } from '../../shared/ui/provide-ui';
import { Shell } from './shell';
import { expectNoAccessibilityViolations } from '../../../testing/axe';
import { DESKTOP_WIDTH, applyScreenWidth } from '../../../testing/viewport';

@Component({ template: '<p>Page content</p>', changeDetection: ChangeDetectionStrategy.OnPush })
class StubPage {}

describe('Shell', () => {
  /** `Playthrough` loads `@defer` blocks for real when they trigger; by default they stay put. */
  async function setup(url: string, deferBlockBehavior = DeferBlockBehavior.Manual) {
    const { navigate } = await render(Shell, {
      deferBlockBehavior,
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
    applyScreenWidth(DESKTOP_WIDTH);

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
    applyScreenWidth(DESKTOP_WIDTH);

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

  it('loads and opens the task form from the sidebar only when asked', async () => {
    await setup('/dashboard', DeferBlockBehavior.Playthrough);
    applyScreenWidth(DESKTOP_WIDTH);
    expect(screen.queryByRole('dialog', { name: 'New task' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '+ New Task' }));

    expect(TestBed.inject(TaskEditorStore).open()).toBe(true);
    expect(await screen.findByRole('dialog', { name: 'New task' })).toBeInTheDocument();
  });

  it('loads the confirm dialog the first time a question is asked', async () => {
    await setup('/dashboard', DeferBlockBehavior.Playthrough);

    void TestBed.inject(ConfirmService).confirm({ title: 'Delete task?', message: 'Sure?' });

    expect(await screen.findByRole('dialog', { name: 'Delete task?' })).toBeInTheDocument();
  });

  it('moves focus to the page content with the skip link', async () => {
    await setup('/dashboard');

    await userEvent.click(screen.getByRole('link', { name: 'Skip to main content' }));

    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('has no accessibility violations', async () => {
    await setup('/dashboard');

    await expectNoAccessibilityViolations();
  });

  it('switches between English and Arabic from the header', async () => {
    await setup('/dashboard');
    const header = within(screen.getByRole('banner'));

    await userEvent.click(header.getByRole('button', { name: 'Switch to العربية' }));
    TestBed.tick();

    expect(document.documentElement.dir).toBe('rtl');
    expect(header.getByRole('button', { name: 'Switch to English' })).toBeInTheDocument();

    await userEvent.click(header.getByRole('button', { name: 'Switch to English' }));
    TestBed.tick();
    expect(document.documentElement.dir).toBe('ltr');
    localStorage.clear();
  });
});
