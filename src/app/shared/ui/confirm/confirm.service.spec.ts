import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { expectNoAccessibilityViolations } from '../../../../testing/axe';
import { provideUi } from '../provide-ui';
import { UiConfirmOutlet } from './confirm-outlet';
import { type ConfirmOptions, ConfirmService } from './confirm.service';

describe('ConfirmService', () => {
  async function ask(options: Partial<ConfirmOptions> = {}) {
    await render(UiConfirmOutlet, { providers: [provideUi()] });
    const service = TestBed.inject(ConfirmService);
    const answer = service.confirm({
      title: 'Delete task?',
      message: 'This cannot be undone.',
      ...options,
    });
    const dialog = await screen.findByRole('dialog', { name: options.title ?? 'Delete task?' });
    return { answer, dialog, service };
  }

  it('asks in a dialog named by its title and resolves true when confirmed', async () => {
    const { answer, dialog } = await ask({ confirmLabel: 'Delete', tone: 'danger' });

    expect(dialog).toHaveTextContent('This cannot be undone.');
    expect(
      screen.getByRole('button', { name: 'Delete' }).closest('.p-dialog-footer'),
    ).not.toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await answer).toBe(true);
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('resolves false when cancelled', async () => {
    const { answer } = await ask();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await answer).toBe(false);
  });

  it('starts on Cancel and resolves false on Escape', async () => {
    const { answer } = await ask();

    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());
    await userEvent.keyboard('{Escape}');

    expect(await answer).toBe(false);
  });

  it('styles the confirm button for destructive actions', async () => {
    const { answer, service } = await ask({ confirmLabel: 'Delete', tone: 'danger' });

    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('p-button-danger');

    service.answer(false);
    await answer;
  });

  it('uses default labels', async () => {
    const { answer } = await ask();

    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(await answer).toBe(true);
  });

  it('treats an open question as cancelled when a new one is asked', async () => {
    const { answer, service } = await ask();

    const next = service.confirm({ title: 'Leave?', message: 'Changes are lost.' });

    expect(await answer).toBe(false);
    expect(await screen.findByRole('dialog', { name: 'Leave?' })).toBeInTheDocument();
    service.answer(true);
    expect(await next).toBe(true);
  });

  it('has no accessibility violations while open', async () => {
    const { answer, service } = await ask();

    await expectNoAccessibilityViolations();

    service.answer(false);
    await answer;
  });
});
