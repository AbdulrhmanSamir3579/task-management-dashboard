import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { provideUi } from '../provide-ui';
import { UiConfirmOutlet } from './confirm-outlet';
import { ConfirmService } from './confirm.service';

describe('ConfirmService', () => {
  async function ask(tone?: 'primary' | 'danger') {
    await render(UiConfirmOutlet, { providers: [provideUi()] });
    const answer = TestBed.inject(ConfirmService).confirm({
      title: 'Delete task?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      tone,
    });
    await screen.findByText('This cannot be undone.');
    return answer;
  }

  it('resolves true when confirmed', async () => {
    const answer = ask('danger');
    await screen.findByText('Delete task?');

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await answer).toBe(true);
  });

  it('resolves false when cancelled', async () => {
    const answer = ask();
    await screen.findByText('Delete task?');

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await answer).toBe(false);
  });

  it('styles the confirm button for destructive actions', async () => {
    const answer = ask('danger');
    await screen.findByText('Delete task?');

    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('p-button-danger');

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await answer;
  });

  it('uses default labels', async () => {
    await render(UiConfirmOutlet, { providers: [provideUi()] });
    const answer = TestBed.inject(ConfirmService).confirm({
      title: 'Leave?',
      message: 'Changes are lost.',
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Confirm' }));

    expect(await answer).toBe(true);
  });
});
