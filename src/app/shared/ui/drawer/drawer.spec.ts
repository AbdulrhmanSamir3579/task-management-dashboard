import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { UiDrawer } from './drawer';

@Component({
  imports: [UiDrawer],
  template: `
    <button type="button" (click)="open.set(true)">Open</button>
    <ui-drawer heading="Filters" [(visible)]="open" (closed)="closed()">
      <p>Drawer body</p>
      <button type="button" uiDrawerFooter (click)="open.set(false)">Done</button>
    </ui-drawer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly open = signal(false);
  closed = vi.fn();
}

describe('UiDrawer', () => {
  async function openDrawer() {
    const { fixture } = await render(Host);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await screen.findByRole('dialog', { name: 'Filters' });
    return fixture.componentInstance;
  }

  it('opens as a modal dialog named by its heading, with body and footer', async () => {
    await openDrawer();

    const drawer = screen.getByRole('dialog', { name: 'Filters' });
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { name: 'Filters' })).toBeInTheDocument();
    expect(screen.getByText('Drawer body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });

  it('closes from its own close button and reports it', async () => {
    const host = await openDrawer();

    await userEvent.click(screen.getByRole('button', { name: 'Close panel' }));

    await vi.waitFor(() => expect(host.open()).toBe(false));
    await vi.waitFor(() => expect(host.closed).toHaveBeenCalled());
  });

  it('closes when the visible state is turned off from outside', async () => {
    const host = await openDrawer();

    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(host.open()).toBe(false);
  });
});
