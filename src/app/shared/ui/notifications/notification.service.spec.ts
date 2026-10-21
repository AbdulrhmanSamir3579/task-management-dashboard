import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { provideUi } from '../provide-ui';
import { NotificationService } from './notification.service';
import { UiToastOutlet } from './toast-outlet';

describe('NotificationService', () => {
  async function setup() {
    await render(UiToastOutlet, { providers: [provideUi()] });
    return TestBed.inject(NotificationService);
  }

  it.each([
    ['success', 'Done', 'Task created.'],
    ['info', 'Info', 'Filters cleared.'],
    ['warning', 'Heads up', 'You are offline.'],
    ['error', 'Something went wrong', 'Could not save.'],
  ] as const)('shows a %s toast with a default title', async (kind, title, message) => {
    const notifications = await setup();

    notifications[kind](message);

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('accepts a custom title', async () => {
    const notifications = await setup();

    notifications.success('Task deleted.', 'Deleted');

    expect(await screen.findByText('Deleted')).toBeInTheDocument();
  });
});
