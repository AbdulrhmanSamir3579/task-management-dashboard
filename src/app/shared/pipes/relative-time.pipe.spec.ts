import { render, screen } from '@testing-library/angular';
import { RelativeTimePipe } from './relative-time.pipe';

describe('RelativeTimePipe', () => {
  it('shows how long ago a timestamp was', async () => {
    await render(`<p>{{ timestamp | relativeTime: now }}</p>`, {
      imports: [RelativeTimePipe],
      componentProperties: {
        timestamp: '2026-10-22T11:00:00.000Z',
        now: new Date('2026-10-22T12:00:00.000Z'),
      },
    });

    expect(screen.getByText('1 hour ago')).toBeInTheDocument();
  });
});
