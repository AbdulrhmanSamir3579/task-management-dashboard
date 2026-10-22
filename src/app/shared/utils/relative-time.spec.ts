import { formatRelativeTime } from './relative-time';

describe('formatRelativeTime', () => {
  const now = new Date('2026-10-22T12:00:00.000Z');
  const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000).toISOString();

  it.each([
    [10, 'just now'],
    [60, '1 minute ago'],
    [5 * 60 + 40, '5 minutes ago'],
    [2 * 60 * 60, '2 hours ago'],
    [30 * 60 * 60, 'yesterday'],
    [3 * 24 * 60 * 60, '3 days ago'],
    [15 * 24 * 60 * 60, '2 weeks ago'],
    [65 * 24 * 60 * 60, '2 months ago'],
    [400 * 24 * 60 * 60, 'last year'],
  ])('describes %i seconds ago as "%s"', (seconds, text) => {
    expect(formatRelativeTime(ago(seconds), now)).toBe(text);
  });

  it('handles timestamps slightly in the future', () => {
    expect(formatRelativeTime(ago(-5 * 60), now)).toBe('in 5 minutes');
  });
});
