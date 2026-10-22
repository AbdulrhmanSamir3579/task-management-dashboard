const UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
];

/**
 * How long ago a timestamp was, in `locale`: "now", "5 minutes ago", "yesterday", "3 weeks
 * ago". `now` is passed in, so the caller decides when the text is refreshed.
 */
export function formatRelativeTime(timestamp: string, now: Date, locale = 'en'): string {
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const seconds = (new Date(timestamp).getTime() - now.getTime()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return formatter.format(Math.trunc(seconds / size), unit);
    }
  }
  return formatter.format(0, 'second');
}
