import { ChangeDetectionStrategy, Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { UiPopover } from './popover';

@Component({
  imports: [UiPopover],
  template: `
    <button
      type="button"
      aria-haspopup="dialog"
      [attr.aria-expanded]="panel.isOpen()"
      (click)="panel.toggle($event)"
    >
      Notifications
    </button>
    <ui-popover #panel label="Recent activity" (opened)="opened()" (closed)="closed()">
      <p>Panel body</p>
      <button type="button" (click)="panel.hide()">Done</button>
    </ui-popover>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  opened = vi.fn();
  closed = vi.fn();
}

describe('UiPopover', () => {
  async function openPanel() {
    const { fixture } = await render(Host);
    const trigger = screen.getByRole('button', { name: 'Notifications' });
    await userEvent.click(trigger);
    const panel = await screen.findByRole('dialog', { name: 'Recent activity' });
    return { host: fixture.componentInstance, trigger, panel };
  }

  it('opens a named panel from its trigger and reports it', async () => {
    const { host, trigger, panel } = await openPanel();

    expect(panel).toHaveTextContent('Panel body');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(host.opened).toHaveBeenCalled();
  });

  it('closes from inside and sends focus back to the trigger', async () => {
    const { host, trigger } = await openPanel();

    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(host.closed).toHaveBeenCalled();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });

  it('closes on Escape', async () => {
    await openPanel();

    await userEvent.keyboard('{Escape}');

    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
