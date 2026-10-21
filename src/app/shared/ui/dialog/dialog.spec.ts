import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { UiDialog } from './dialog';

@Component({
  imports: [UiDialog],
  template: `
    <button type="button" (click)="open.set(true)">Open</button>
    <ui-dialog
      heading="New task"
      [dismissable]="dismissable"
      [(visible)]="open"
      (closed)="closed()"
    >
      <p>Dialog body</p>
      <button type="button" uiDialogFooter (click)="open.set(false)">Done</button>
    </ui-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly open = signal(false);
  dismissable = true;
  closed = vi.fn();
}

describe('UiDialog', () => {
  async function openDialog(dismissable = true) {
    const { fixture } = await render(Host, { componentProperties: { dismissable } });
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await screen.findByRole('dialog', { name: 'New task' });
    return fixture.componentInstance;
  }

  it('shows header, body and footer when opened', async () => {
    await openDialog();

    expect(screen.getByText('Dialog body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });

  it('closes from its own close button and reports it', async () => {
    const host = await openDialog();

    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    await vi.waitFor(() => expect(host.open()).toBe(false));
    await vi.waitFor(() => expect(host.closed).toHaveBeenCalled());
  });

  it('closes when the visible state is turned off from outside', async () => {
    const host = await openDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(host.open()).toBe(false);
  });

  describe('with a close guard', () => {
    @Component({
      imports: [UiDialog],
      template: `
        <ui-dialog heading="Edit task" [beforeClose]="guard" [(visible)]="open">
          <p>Form</p>
        </ui-dialog>
      `,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class GuardedHost {
      readonly open = signal(true);
      guard = vi.fn(() => false);
    }

    async function openGuarded(answer: boolean) {
      const { fixture } = await render(GuardedHost);
      fixture.componentInstance.guard.mockResolvedValue(answer);
      await screen.findByRole('dialog', { name: 'Edit task' });
      return fixture.componentInstance;
    }

    it('keeps the dialog open when the guard says no', async () => {
      const host = await openGuarded(false);

      await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }));

      await vi.waitFor(() => expect(host.guard).toHaveBeenCalled());
      expect(host.open()).toBe(true);
      expect(screen.getByRole('dialog', { name: 'Edit task' })).toBeInTheDocument();
    });

    it('closes when the guard agrees', async () => {
      const host = await openGuarded(true);

      await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }));

      await vi.waitFor(() => expect(host.open()).toBe(false));
    });

    it('asks the guard on Escape', async () => {
      const host = await openGuarded(true);

      await userEvent.keyboard('{Escape}');

      await vi.waitFor(() => expect(host.open()).toBe(false));
      expect(host.guard).toHaveBeenCalledTimes(1);
    });
  });

  it('hides the close button when not dismissable', async () => {
    await openDialog(false);
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });
});
